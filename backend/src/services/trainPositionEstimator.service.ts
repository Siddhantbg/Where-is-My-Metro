import db from '../config/database';
import { trainSightings, metroStations, stationConnections } from '../db/schema';
import { eq, and, desc, gte } from 'drizzle-orm';

export interface EstimatedTrainPosition {
  lineId: string;
  direction: 'forward' | 'backward';
  status: 'at_station' | 'in_transit' | 'unknown';
  currentStationId: string;
  currentStationName: string;
  nextStationId: string | null;
  nextStationName: string | null;
  progressPercent: number; // 0-100 for in_transit
  confidence: 'high' | 'medium' | 'low';
  confidenceScore: number; // 0.0 to 1.0
  lastSightingAge: number; // seconds since last sighting
  estimatedArrivalNextStation: number | null; // seconds
}

/**
 * Estimate current train position from crowdsourced sightings
 */
export async function estimateTrainPosition(
  lineId: string,
  direction: 'forward' | 'backward',
  maxAge: number = 600 // Maximum age of sightings in seconds (default 10 min)
): Promise<EstimatedTrainPosition | null> {
  try {
    const cutoffTime = new Date(Date.now() - maxAge * 1000);

    // Get the most recent sighting for this line and direction
    const recentSightings = await db
      .select({
        sighting: trainSightings,
        station: metroStations,
      })
      .from(trainSightings)
      .innerJoin(metroStations, eq(trainSightings.stationId, metroStations.id))
      .where(
        and(
          eq(trainSightings.lineId, lineId),
          eq(trainSightings.direction, direction),
          gte(trainSightings.timestamp, cutoffTime)
        )
      )
      .orderBy(desc(trainSightings.timestamp))
      .limit(1);

    if (recentSightings.length === 0) {
      // No recent sightings available
      return null;
    }

    const latestSighting = recentSightings[0];
    const ageSeconds = Math.floor(
      (Date.now() - latestSighting.sighting.timestamp.getTime()) / 1000
    );

    // Get the next station based on direction
    const nextStation = await getNextStation(
      latestSighting.sighting.stationId,
      lineId,
      direction
    );

    // Calculate train position based on time elapsed
    const position = calculatePositionFromAge(
      ageSeconds,
      latestSighting,
      nextStation
    );

    // Calculate confidence level based on age and sighting confidence
    const confidence = calculateConfidence(
      ageSeconds,
      latestSighting.sighting.confidenceScore || 1.0
    );

    return {
      lineId,
      direction,
      status: position.status,
      currentStationId: position.currentStationId,
      currentStationName: position.currentStationName,
      nextStationId: position.nextStationId,
      nextStationName: position.nextStationName,
      progressPercent: position.progressPercent,
      confidence: confidence.level,
      confidenceScore: confidence.score,
      lastSightingAge: ageSeconds,
      estimatedArrivalNextStation: position.estimatedArrival,
    };
  } catch (error) {
    console.error('Error estimating train position:', error);
    return null;
  }
}

/**
 * Get all active train positions for a line (both directions)
 */
export async function getAllTrainPositions(
  lineId: string,
  maxAge: number = 600
): Promise<EstimatedTrainPosition[]> {
  const positions: EstimatedTrainPosition[] = [];

  // Get positions for both directions
  const forwardPosition = await estimateTrainPosition(lineId, 'forward', maxAge);
  const backwardPosition = await estimateTrainPosition(lineId, 'backward', maxAge);

  if (forwardPosition) positions.push(forwardPosition);
  if (backwardPosition) positions.push(backwardPosition);

  return positions;
}

/**
 * Get next station based on current station, line, and direction
 */
async function getNextStation(
  currentStationId: string,
  lineId: string,
  direction: 'forward' | 'backward'
): Promise<{ id: string; name: string; travelTime: number } | null> {
  try {
    // Get connection from current station to next station
    const connections = await db
      .select({
        connection: stationConnections,
        toStation: metroStations,
      })
      .from(stationConnections)
      .innerJoin(
        metroStations,
        eq(stationConnections.toStationId, metroStations.id)
      )
      .where(
        and(
          eq(stationConnections.fromStationId, currentStationId),
          eq(stationConnections.lineId, lineId)
        )
      )
      .limit(1);

    if (connections.length === 0) {
      return null;
    }

    const connection = connections[0];
    return {
      id: connection.toStation.id,
      name: connection.toStation.name,
      travelTime: connection.connection.travelTimeSeconds,
    };
  } catch (error) {
    console.error('Error getting next station:', error);
    return null;
  }
}

/**
 * Calculate train position based on time elapsed since sighting
 */
function calculatePositionFromAge(
  ageSeconds: number,
  latestSighting: any,
  nextStation: { id: string; name: string; travelTime: number } | null
): {
  status: 'at_station' | 'in_transit' | 'unknown';
  currentStationId: string;
  currentStationName: string;
  nextStationId: string | null;
  nextStationName: string | null;
  progressPercent: number;
  estimatedArrival: number | null;
} {
  const DWELL_TIME = 30; // Average station dwell time in seconds
  const AVERAGE_TRAVEL_TIME = 120; // Default if no data available

  // If less than dwell time, train is still at the station
  if (ageSeconds < DWELL_TIME) {
    return {
      status: 'at_station',
      currentStationId: latestSighting.sighting.stationId,
      currentStationName: latestSighting.station.name,
      nextStationId: nextStation?.id || null,
      nextStationName: nextStation?.name || null,
      progressPercent: 0,
      estimatedArrival: nextStation ? nextStation.travelTime : null,
    };
  }

  // If between dwell time and travel time, train is in transit
  const travelTime = nextStation?.travelTime || AVERAGE_TRAVEL_TIME;
  const transitTime = ageSeconds - DWELL_TIME;

  if (transitTime < travelTime && nextStation) {
    const progressPercent = Math.min(100, (transitTime / travelTime) * 100);
    const remainingTime = travelTime - transitTime;

    return {
      status: 'in_transit',
      currentStationId: latestSighting.sighting.stationId,
      currentStationName: latestSighting.station.name,
      nextStationId: nextStation.id,
      nextStationName: nextStation.name,
      progressPercent,
      estimatedArrival: remainingTime,
    };
  }

  // If more time has passed, train has likely reached next station
  if (nextStation) {
    return {
      status: 'at_station',
      currentStationId: nextStation.id,
      currentStationName: nextStation.name,
      nextStationId: null,
      nextStationName: null,
      progressPercent: 0,
      estimatedArrival: null,
    };
  }

  // Unknown status - data too old or incomplete
  return {
    status: 'unknown',
    currentStationId: latestSighting.sighting.stationId,
    currentStationName: latestSighting.station.name,
    nextStationId: null,
    nextStationName: null,
    progressPercent: 0,
    estimatedArrival: null,
  };
}

/**
 * Calculate confidence level based on sighting age and quality
 */
function calculateConfidence(
  ageSeconds: number,
  sightingConfidence: number
): { level: 'high' | 'medium' | 'low'; score: number } {
  // Age-based confidence decay
  let ageConfidence = 1.0;
  if (ageSeconds < 60) {
    ageConfidence = 1.0; // < 1 min: high confidence
  } else if (ageSeconds < 180) {
    ageConfidence = 0.8; // 1-3 min: medium-high confidence
  } else if (ageSeconds < 300) {
    ageConfidence = 0.6; // 3-5 min: medium confidence
  } else {
    ageConfidence = 0.4; // > 5 min: low confidence
  }

  // Combine sighting quality with age-based confidence
  const combinedScore = sightingConfidence * ageConfidence;

  // Determine confidence level
  let level: 'high' | 'medium' | 'low';
  if (combinedScore >= 0.7) {
    level = 'high';
  } else if (combinedScore >= 0.4) {
    level = 'medium';
  } else {
    level = 'low';
  }

  return { level, score: combinedScore };
}

/**
 * Get estimated positions for all trains on a user's route
 */
export async function getRouteTrainPositions(
  route: string[], // Array of station IDs in order
  lineId: string,
  direction: 'forward' | 'backward',
  maxAge: number = 600
): Promise<EstimatedTrainPosition | null> {
  // For now, just get the general position for the line
  // In the future, this could be enhanced to show multiple trains on the route
  return estimateTrainPosition(lineId, direction, maxAge);
}
