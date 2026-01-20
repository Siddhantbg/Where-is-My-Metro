import { Request, Response } from 'express';
import db from '../config/database';
import { trainSightings, metroStations, metroLines } from '../db/schema';
import { eq, and, desc, gte } from 'drizzle-orm';
import {
  estimateTrainPosition,
  getAllTrainPositions,
  getRouteTrainPositions,
} from '../services/trainPositionEstimator.service';

/**
 * POST /api/train-sightings
 * Report a train sighting from a user
 */
export async function reportTrainSighting(req: Request, res: Response) {
  try {
    const {
      lineId,
      stationId,
      direction,
      userId,
      userLatitude,
      userLongitude,
    } = req.body;

    // Validation
    if (!lineId || !stationId || !direction) {
      return res.status(400).json({
        error: 'Missing required fields: lineId, stationId, direction',
      });
    }

    if (!['forward', 'backward'].includes(direction)) {
      return res.status(400).json({
        error: 'Direction must be either "forward" or "backward"',
      });
    }

    // Verify station exists
    const station = await db.select()
      .from(metroStations)
      .where(eq(metroStations.id, stationId))
      .limit(1);

    if (station.length === 0) {
      return res.status(404).json({
        error: 'Station not found',
      });
    }

    // Verify line exists
    const line = await db.select()
      .from(metroLines)
      .where(eq(metroLines.id, lineId))
      .limit(1);

    if (line.length === 0) {
      return res.status(404).json({
        error: 'Metro line not found',
      });
    }

    // Calculate confidence score based on proximity (if GPS provided)
    let confidenceScore = 1.0;
    if (userLatitude && userLongitude) {
      const stationLat = station[0].latitude;
      const stationLng = station[0].longitude;
      const distance = calculateHaversineDistance(
        userLatitude,
        userLongitude,
        stationLat,
        stationLng
      );

      // Confidence decreases with distance
      // Within 100m: 1.0, 200m: 0.9, 500m: 0.7, 1km+: 0.5
      if (distance < 100) confidenceScore = 1.0;
      else if (distance < 200) confidenceScore = 0.9;
      else if (distance < 500) confidenceScore = 0.7;
      else confidenceScore = 0.5;
    }

    // Insert sighting
    const now = new Date();
    const [sighting] = await db.insert(trainSightings).values({
      lineId,
      stationId,
      direction,
      timestamp: now,
      userId: userId || null,
      userLatitude: userLatitude || null,
      userLongitude: userLongitude || null,
      confidenceScore,
      isVerified: false,
      createdAt: now,
    }).returning();

    return res.status(201).json({
      message: 'Train sighting reported successfully',
      sighting: {
        id: sighting.id,
        lineId: sighting.lineId,
        stationId: sighting.stationId,
        direction: sighting.direction,
        timestamp: sighting.timestamp,
        confidenceScore: sighting.confidenceScore,
      },
    });
  } catch (error) {
    console.error('Error reporting train sighting:', error);
    return res.status(500).json({
      error: 'Failed to report train sighting',
    });
  }
}

/**
 * GET /api/train-positions/:lineId
 * Get estimated train positions for a specific metro line using the estimation algorithm
 */
export async function getTrainPositions(req: Request, res: Response) {
  try {
    const { lineId } = req.params;
    const { direction, maxAge = 600 } = req.query; // maxAge in seconds (default 10 min)

    let positions;

    if (direction && ['forward', 'backward'].includes(direction as string)) {
      // Get position for specific direction
      const position = await estimateTrainPosition(
        lineId,
        direction as 'forward' | 'backward',
        Number(maxAge)
      );
      positions = position ? [position] : [];
    } else {
      // Get positions for both directions
      positions = await getAllTrainPositions(lineId, Number(maxAge));
    }

    return res.json({
      lineId,
      positions,
      hasLiveData: positions.length > 0,
    });
  } catch (error) {
    console.error('Error fetching train positions:', error);
    return res.status(500).json({
      error: 'Failed to fetch train positions',
    });
  }
}

/**
 * GET /api/live-tracking/:origin/:destination
 * Get live tracking data for a specific route
 */
export async function getLiveRouteTracking(req: Request, res: Response) {
  try {
    const { origin, destination } = req.params;
    const { maxAge = 600 } = req.query; // maxAge in seconds

    // This endpoint will need route information to determine which line(s) to track
    // For now, we'll return recent sightings for stations on the route
    // This will be enhanced once we integrate with route finding

    const cutoffTime = new Date(Date.now() - Number(maxAge) * 1000);

    // Get recent sightings for origin and destination stations
    const sightings = await db.select({
      sighting: trainSightings,
      station: metroStations,
      line: metroLines,
    })
      .from(trainSightings)
      .innerJoin(metroStations, eq(trainSightings.stationId, metroStations.id))
      .innerJoin(metroLines, eq(trainSightings.lineId, metroLines.id))
      .where(gte(trainSightings.timestamp, cutoffTime))
      .orderBy(desc(trainSightings.timestamp))
      .limit(20);

    return res.json({
      route: { origin, destination },
      recentSightings: sightings.map(s => ({
        stationId: s.sighting.stationId,
        stationName: s.station.name,
        lineId: s.sighting.lineId,
        lineName: s.line.name,
        direction: s.sighting.direction,
        timestamp: s.sighting.timestamp,
        ageSeconds: Math.floor((Date.now() - s.sighting.timestamp.getTime()) / 1000),
        confidenceScore: s.sighting.confidenceScore,
      })),
    });
  } catch (error) {
    console.error('Error fetching live route tracking:', error);
    return res.status(500).json({
      error: 'Failed to fetch live route tracking',
    });
  }
}

/**
 * GET /api/train-sightings/recent
 * Get recent sightings across all lines (for debugging/admin)
 */
export async function getRecentSightings(req: Request, res: Response) {
  try {
    const { limit = 50, cityId } = req.query;

    let query = db.select({
      sighting: trainSightings,
      station: metroStations,
      line: metroLines,
    })
      .from(trainSightings)
      .innerJoin(metroStations, eq(trainSightings.stationId, metroStations.id))
      .innerJoin(metroLines, eq(trainSightings.lineId, metroLines.id))
      .orderBy(desc(trainSightings.timestamp))
      .limit(Number(limit));

    // Filter by city if provided
    if (cityId) {
      query = query.where(eq(metroStations.cityId, cityId as string));
    }

    const results = await query;

    return res.json({
      sightings: results.map(r => ({
        id: r.sighting.id,
        stationId: r.sighting.stationId,
        stationName: r.station.name,
        lineId: r.sighting.lineId,
        lineName: r.line.name,
        lineColor: r.line.color,
        direction: r.sighting.direction,
        timestamp: r.sighting.timestamp,
        ageSeconds: Math.floor((Date.now() - r.sighting.timestamp.getTime()) / 1000),
        confidenceScore: r.sighting.confidenceScore,
        isVerified: r.sighting.isVerified,
      })),
      total: results.length,
    });
  } catch (error) {
    console.error('Error fetching recent sightings:', error);
    return res.status(500).json({
      error: 'Failed to fetch recent sightings',
    });
  }
}

/**
 * Helper: Calculate distance between two GPS coordinates using Haversine formula
 */
function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}
