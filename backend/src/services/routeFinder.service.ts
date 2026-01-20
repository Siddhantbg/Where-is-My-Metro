import db from '../config/database';
import { metroStations, lineStations, stationConnections, metroLines } from '../db/schema';
import { eq, sql } from 'drizzle-orm';
import { Graph } from '../utils/graph';

interface RouteResult {
  route: string[];
  transfers: Array<{
    station: string;
    fromLine: string;
    toLine: string;
  }>;
  estimatedDuration: number;
  nextTrainDeparture?: string;
}

export async function findShortestRoute(
  originId: string,
  destinationId: string,
  departureTime?: string
): Promise<RouteResult | null> {
  try {
    // Verify both stations exist
    const origin = await db.select().from(metroStations).where(eq(metroStations.id, originId)).limit(1);
    const destination = await db.select().from(metroStations).where(eq(metroStations.id, destinationId)).limit(1);

    if (origin.length === 0 || destination.length === 0) {
      return null;
    }

    // CRITICAL: Validate same city
    if (origin[0].cityId !== destination[0].cityId) {
      throw new Error('Origin and destination must be in the same city');
    }

    // Build graph from station connections (filtered by city)
    const cityId = origin[0].cityId;
    const graph = new Graph();
    const connections = await db.select().from(stationConnections).all();

    // Add all edges (bidirectional)
    for (const conn of connections) {
      const weight = conn.travelTimeSeconds + conn.stopTimeSeconds;

      // Forward direction
      graph.addEdge(
        conn.fromStationId,
        conn.toStationId,
        weight,
        conn.lineId
      );

      // Backward direction
      graph.addEdge(
        conn.toStationId,
        conn.fromStationId,
        weight,
        conn.lineId
      );
    }

    // Run Dijkstra's algorithm
    const result = graph.findShortestPath(originId, destinationId);

    if (!result) {
      return null;
    }

    // Detect transfers (line changes)
    const transfers: Array<{ station: string; fromLine: string; toLine: string }> = [];

    for (let i = 1; i < result.edges.length; i++) {
      const prevEdge = result.edges[i - 1];
      const currentEdge = result.edges[i];

      if (prevEdge.lineId !== currentEdge.lineId) {
        transfers.push({
          station: currentEdge.fromStation,
          fromLine: prevEdge.lineId,
          toLine: currentEdge.lineId,
        });
      }
    }

    // Calculate total duration (in seconds)
    // Add 2 minutes (120 seconds) for each transfer
    const transferTime = transfers.length * 120;
    const estimatedDuration = Math.round(result.distance) + transferTime;

    // Calculate next train departure (simplified)
    const now = new Date();
    const nextDeparture = departureTime ? new Date(departureTime) : now;

    // Add 3-5 minutes to current time for next train (simplified)
    if (!departureTime) {
      nextDeparture.setMinutes(nextDeparture.getMinutes() + 3);
    }

    return {
      route: result.path,
      transfers,
      estimatedDuration,
      nextTrainDeparture: nextDeparture.toISOString(),
    };
  } catch (error) {
    console.error('Error in findShortestRoute:', error);
    return null;
  }
}
