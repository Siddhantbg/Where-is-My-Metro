import { Request, Response } from 'express';
import { eq, sql, and, inArray } from 'drizzle-orm';
import db from '../config/database';
import { metroStations, lineStations } from '../db/schema';

export const getAllStations = async (req: Request, res: Response) => {
  try {
    const { lineId, cityId } = req.query;

    if (lineId) {
      // Get stations for a specific line with proper ordering
      const stationsWithOrder = await db
        .select({
          id: metroStations.id,
          name: metroStations.name,
          latitude: metroStations.latitude,
          longitude: metroStations.longitude,
          isInterchange: metroStations.isInterchange,
          sequenceNumber: lineStations.sequenceNumber
        })
        .from(metroStations)
        .innerJoin(lineStations, eq(metroStations.id, lineStations.stationId))
        .where(eq(lineStations.lineId, lineId as string))
        .orderBy(lineStations.sequenceNumber);

      return res.json(stationsWithOrder);
    }

    // Get all stations, optionally filtered by cityId
    let query = db.select().from(metroStations);

    if (cityId && typeof cityId === 'string') {
      query = query.where(eq(metroStations.cityId, cityId)) as any;
    }

    const stations = await query;
    res.json(stations);
  } catch (error) {
    console.error('Error fetching stations:', error);
    res.status(500).json({ error: 'Failed to fetch stations' });
  }
};

export const getStationById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const station = await db.select().from(metroStations).where(eq(metroStations.id, id)).limit(1);

    if (station.length === 0) {
      return res.status(404).json({ error: 'Station not found' });
    }

    res.json(station[0]);
  } catch (error) {
    console.error('Error fetching station:', error);
    res.status(500).json({ error: 'Failed to fetch station' });
  }
};

export const getNearbyStations = async (req: Request, res: Response) => {
  try {
    const { lat, lng, radius = 2000, cityId } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const userLat = parseFloat(lat as string);
    const userLng = parseFloat(lng as string);
    const radiusMeters = parseInt(radius as string);

    // Get all stations (filtered by cityId if provided) and calculate distance using Haversine formula
    let query = db.select().from(metroStations);

    if (cityId && typeof cityId === 'string') {
      query = query.where(eq(metroStations.cityId, cityId)) as any;
    }

    const allStations = await query;

    // Calculate distances and filter
    const stationsWithDistance = allStations
      .map(station => {
        // Haversine formula
        const R = 6371000; // Earth's radius in meters
        const lat1Rad = (userLat * Math.PI) / 180;
        const lat2Rad = (station.latitude * Math.PI) / 180;
        const deltaLat = ((station.latitude - userLat) * Math.PI) / 180;
        const deltaLng = ((station.longitude - userLng) * Math.PI) / 180;

        const a =
          Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
          Math.cos(lat1Rad) *
            Math.cos(lat2Rad) *
            Math.sin(deltaLng / 2) *
            Math.sin(deltaLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        return { ...station, distance };
      })
      .filter(station => station.distance < radiusMeters)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 10);

    res.json(stationsWithDistance);
  } catch (error) {
    console.error('Error fetching nearby stations:', error);
    res.status(500).json({ error: 'Failed to fetch nearby stations' });
  }
};
