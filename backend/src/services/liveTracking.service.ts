import { LiveTrain, TrainReport, SegmentSpeed } from '../types/tracking';
import { MetroStation, StationConnection } from '../db/schema';

// In-memory store for live trains and reports (in production, use Redis)
const liveTrains = new Map<string, LiveTrain>();
const recentReports = new Map<string, TrainReport[]>();
const segmentSpeeds = new Map<string, SegmentSpeed>();

const REPORT_RETENTION_MS = 5 * 60 * 1000; // 5 minutes
const TRAIN_STALE_MS = 5 * 60 * 1000; // 5 minutes without update
const CONFIDENCE_DECAY_MS = 60 * 1000; // Decay confidence after 1 minute
const MAX_SPEED = 90; // km/h
const MIN_SPEED = 0;

/**
 * Calculate distance between two points using Haversine formula
 */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Snap a lat/lng to the nearest point on the line polyline
 */
export function snapToTrack(
  lat: number,
  lng: number,
  linePolyline: Array<{ lat: number; lng: number }>
): { lat: number; lng: number; distanceToTrack: number } {
  let minDist = Infinity;
  let snappedPoint = { lat, lng };

  for (let i = 0; i < linePolyline.length - 1; i++) {
    const p1 = linePolyline[i];
    const p2 = linePolyline[i + 1];
    const snapped = snapToSegment(lat, lng, p1.lat, p1.lng, p2.lat, p2.lng);
    const dist = haversineDistance(lat, lng, snapped.lat, snapped.lng);

    if (dist < minDist) {
      minDist = dist;
      snappedPoint = snapped;
    }
  }

  return { lat: snappedPoint.lat, lng: snappedPoint.lng, distanceToTrack: minDist };
}

/**
 * Snap point to a line segment
 */
function snapToSegment(
  lat: number,
  lng: number,
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): { lat: number; lng: number } {
  const A = lng - lng1;
  const B = lat - lat1;
  const C = lng2 - lng1;
  const D = lat2 - lat1;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;

  if (lenSq !== 0) param = dot / lenSq;

  let xx, yy;

  if (param < 0) {
    xx = lng1;
    yy = lat1;
  } else if (param > 1) {
    xx = lng2;
    yy = lat2;
  } else {
    xx = lng1 + param * C;
    yy = lat1 + param * D;
  }

  return { lat: yy, lng: xx };
}

/**
 * Validate speed plausibility
 */
export function isValidSpeed(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
  timeDeltaSeconds: number
): boolean {
  if (timeDeltaSeconds < 1) return false;

  const distKm = haversineDistance(lat1, lng1, lat2, lng2);
  const speedKmH = (distKm / timeDeltaSeconds) * 3600;

  return speedKmH >= MIN_SPEED && speedKmH <= MAX_SPEED;
}

/**
 * Process incoming train report and update live train state
 */
export function processTrainReport(
  report: TrainReport,
  stations: MetroStation[],
  connections: StationConnection[]
): void {
  const trainKey = `${report.lineId}-${report.direction}`;

  // Store report
  if (!recentReports.has(trainKey)) {
    recentReports.set(trainKey, []);
  }
  const reports = recentReports.get(trainKey)!;
  reports.push(report);

  // Remove stale reports
  const now = Date.now();
  const freshReports = reports.filter((r) => now - r.timestamp < REPORT_RETENTION_MS);
  recentReports.set(trainKey, freshReports);

  // Calculate position and confidence
  if (freshReports.length === 0) {
    liveTrains.delete(trainKey);
    return;
  }

  // Weight reports: onboard > platform > observer
  const weights = freshReports.map((r) => {
    const sourceWeight = r.source === 'onboard' ? 3 : r.source === 'platform' ? 2 : 1;
    const recencyFactor = Math.exp(-((now - r.timestamp) / CONFIDENCE_DECAY_MS));
    return sourceWeight * recencyFactor;
  });

  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let weightedLat = 0;
  let weightedLng = 0;
  let weightedSpeed = 0;

  freshReports.forEach((r, i) => {
    const w = weights[i] / totalWeight;
    weightedLat += r.latitude * w;
    weightedLng += r.longitude * w;
    if (r.speed) weightedSpeed += r.speed * w;
  });

  // Confidence based on report count and consistency
  const confidence = Math.min(1, (freshReports.length / 3) * 0.7 + 0.3);

  liveTrains.set(trainKey, {
    trainId: report.trainId,
    lineId: report.lineId,
    cityId: report.cityId,
    currentLatitude: weightedLat,
    currentLongitude: weightedLng,
    direction: report.direction,
    speed: weightedSpeed,
    confidence,
    lastUpdate: now,
    reportCount: freshReports.length,
    isActive: true,
  });
}

/**
 * Get all live trains for a city/line
 */
export function getLiveTrains(lineId?: string, cityId?: string): LiveTrain[] {
  const now = Date.now();
  const trains: LiveTrain[] = [];

  liveTrains.forEach((train) => {
    if (lineId && train.lineId !== lineId) return;
    if (cityId && train.cityId !== cityId) return;

    // Check if stale
    const isStale = now - train.lastUpdate > TRAIN_STALE_MS;
    if (isStale) {
      train.isActive = false;
    }

    if (!isStale || train.confidence > 0.5) {
      trains.push(train);
    }
  });

  return trains;
}

/**
 * Get live train by ID
 */
export function getLiveTrainById(trainId: string): LiveTrain | null {
  let train: LiveTrain | null = null;

  liveTrains.forEach((t) => {
    if (t.trainId === trainId) {
      train = t;
    }
  });

  return train;
}

/**
 * Calculate next station ETA based on position and segment speeds
 */
export function calculateNextStationETA(
  currentLat: number,
  currentLng: number,
  stations: MetroStation[],
  connections: StationConnection[],
  lineId: string,
  direction: 'forward' | 'backward'
): { stationId?: string; etaSeconds?: number } {
  // Find nearest station ahead in direction
  // This is a simplified version; in production, use line geometry
  // and calculate distance along track, not straight-line distance

  let nearestAhead: {
    stationId: string;
    distance: number;
  } | null = null;

  stations.forEach((station) => {
    const dist = haversineDistance(currentLat, currentLng, station.latitude, station.longitude);
    if (!nearestAhead || dist < nearestAhead.distance) {
      nearestAhead = {
        stationId: station.id,
        distance: dist,
      };
    }
  });

  if (!nearestAhead) return {};

  // Estimate ETA: distance / average speed
  // Default to 40 km/h if no speed data
  const speedKmH = 40;
  const etaSeconds = Math.round((nearestAhead.distance / speedKmH) * 3600);

  return {
    stationId: nearestAhead.stationId,
    etaSeconds,
  };
}

/**
 * Update segment speed statistics for ETA calculations
 */
export function updateSegmentSpeed(
  fromStationId: string,
  toStationId: string,
  speedKmH: number,
  lineId: string
): void {
  const key = `${lineId}-${fromStationId}-${toStationId}`;

  if (!segmentSpeeds.has(key)) {
    segmentSpeeds.set(key, {
      fromStationId,
      toStationId,
      avgSpeed: speedKmH,
      sampleCount: 1,
      lastUpdated: Date.now(),
    });
  } else {
    const segment = segmentSpeeds.get(key)!;
    // Rolling average
    segment.avgSpeed = (segment.avgSpeed * segment.sampleCount + speedKmH) / (segment.sampleCount + 1);
    segment.sampleCount++;
    segment.lastUpdated = Date.now();
  }
}

/**
 * Clean up stale data periodically
 */
export function cleanupStaleData(): void {
  const now = Date.now();

  // Remove stale trains
  liveTrains.forEach((train, key) => {
    if (now - train.lastUpdate > TRAIN_STALE_MS) {
      liveTrains.delete(key);
    }
  });

  // Remove old segment speeds
  segmentSpeeds.forEach((segment, key) => {
    if (now - segment.lastUpdated > 30 * 60 * 1000) {
      // 30 minutes
      segmentSpeeds.delete(key);
    }
  });
}

// Run cleanup every 5 minutes
setInterval(cleanupStaleData, 5 * 60 * 1000);
