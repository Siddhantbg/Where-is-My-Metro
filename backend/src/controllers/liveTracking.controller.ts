import { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import db from '../config/database';
import {
  processTrainReport,
  getLiveTrains,
  getLiveTrainById,
  calculateNextStationETA,
  isValidSpeed,
} from '../services/liveTracking.service';
import { TrainReport } from '../types/tracking';
import { metroStations, stationConnections } from '../db/schema';

/**
 * POST /api/live/trains/report
 * Report a train sighting with optional location data
 */
export async function reportTrainLocation(req: Request, res: Response): Promise<void> {
  try {
    const {
      trainId,
      lineId,
      cityId,
      latitude,
      longitude,
      direction,
      source,
      userId,
      speed,
      accuracy,
    } = req.body;

    // Validation
    if (!trainId || !lineId || !cityId || latitude === undefined || longitude === undefined) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    if (!['forward', 'backward'].includes(direction)) {
      res.status(400).json({ error: 'Invalid direction' });
      return;
    }

    if (!['onboard', 'platform', 'observer'].includes(source)) {
      res.status(400).json({ error: 'Invalid source' });
      return;
    }

    // Basic geolocation validation
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      res.status(400).json({ error: 'Invalid coordinates' });
      return;
    }

    const report: TrainReport = {
      trainId,
      lineId,
      cityId,
      latitude,
      longitude,
      direction,
      source,
      timestamp: Date.now(),
      userId,
      speed,
      accuracy,
    };

    // Process the report
    const stations = await db.select().from(metroStations).where(eq(metroStations.cityId, cityId));
    const connections = await db.select().from(stationConnections).where(eq(stationConnections.lineId, lineId));

    processTrainReport(report, stations as any, connections as any);

    res.json({
      success: true,
      message: 'Train report accepted',
      trainId,
    });
  } catch (error) {
    console.error('Error reporting train location:', error);
    res.status(500).json({ error: 'Failed to process report' });
  }
}

/**
 * GET /api/live/trains
 * Get all live trains, optionally filtered by lineId or cityId
 */
export async function getLiveTrainsHandler(req: Request, res: Response): Promise<void> {
  try {
    const { lineId, cityId } = req.query;

    const trains = getLiveTrains(lineId as string, cityId as string);

    res.json({
      success: true,
      trains,
      count: trains.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching live trains:', error);
    res.status(500).json({ error: 'Failed to fetch live trains' });
  }
}

/**
 * GET /api/live/trains/:trainId
 * Get detailed info about a specific train
 */
export async function getTrainDetails(req: Request, res: Response): Promise<void> {
  try {
    const { trainId } = req.params;

    if (!trainId || Array.isArray(trainId)) {
      res.status(400).json({ error: 'Invalid train ID' });
      return;
    }

    const train = getLiveTrainById(trainId);

    if (!train) {
      res.status(404).json({ error: 'Train not found' });
      return;
    }

    // Calculate next station ETA
    const stations = await db.select().from(metroStations).where(eq(metroStations.cityId, train.cityId));
    const connections = await db
      .select()
      .from(stationConnections)
      .where(eq(stationConnections.lineId, train.lineId));

    const nextStation = calculateNextStationETA(
      train.currentLatitude,
      train.currentLongitude,
      stations as any,
      connections as any,
      train.lineId,
      train.direction
    );

    res.json({
      success: true,
      train: {
        ...train,
        nextStation,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching train details:', error);
    res.status(500).json({ error: 'Failed to fetch train details' });
  }
}

/**
 * POST /api/live/trains/attach
 * User declares they are on a train to start sharing location
 */
export async function attachToTrain(req: Request, res: Response): Promise<void> {
  try {
    const { userId, trainId, lineId, cityId } = req.body;

    if (!userId || !trainId || !lineId || !cityId) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    // In production, you'd store this in a database or Redis
    // This allows you to track which users are on which trains
    // for targeted live updates and battery optimization

    res.json({
      success: true,
      message: 'Attached to train',
      trainId,
      userId,
    });
  } catch (error) {
    console.error('Error attaching to train:', error);
    res.status(500).json({ error: 'Failed to attach to train' });
  }
}

/**
 * POST /api/live/trains/detach
 * User stops sharing their location
 */
export async function detachFromTrain(req: Request, res: Response): Promise<void> {
  try {
    const { userId, trainId } = req.body;

    if (!userId || !trainId) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    // Stop tracking this user's train

    res.json({
      success: true,
      message: 'Detached from train',
      trainId,
      userId,
    });
  } catch (error) {
    console.error('Error detaching from train:', error);
    res.status(500).json({ error: 'Failed to detach from train' });
  }
}

/**
 * GET /api/live/trains/:lineId/direction/:direction
 * Get live trains on a specific line and direction
 */
export async function getLineTrains(req: Request, res: Response): Promise<void> {
  try {
    const { lineId, direction } = req.params;
    const { cityId } = req.query;

    if (Array.isArray(lineId) || Array.isArray(direction)) {
      res.status(400).json({ error: 'Invalid parameters' });
      return;
    }

    if (!['forward', 'backward'].includes(direction)) {
      res.status(400).json({ error: 'Invalid direction' });
      return;
    }

    const trains = getLiveTrains(lineId, typeof cityId === 'string' ? cityId : undefined).filter(
      (t) => t.direction === direction
    );

    res.json({
      success: true,
      lineId,
      direction,
      trains,
      count: trains.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching line trains:', error);
    res.status(500).json({ error: 'Failed to fetch line trains' });
  }
}
