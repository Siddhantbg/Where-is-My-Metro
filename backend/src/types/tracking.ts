// In-transit tracking types
export interface TrainReport {
  trainId: string;
  lineId: string;
  cityId: string;
  latitude: number;
  longitude: number;
  direction: 'forward' | 'backward';
  source: 'onboard' | 'platform' | 'observer'; // onboard = highest confidence
  timestamp: number;
  userId?: string;
  speed?: number; // km/h
  accuracy?: number; // meters
}

export interface LiveTrain {
  trainId: string;
  lineId: string;
  cityId: string;
  currentLatitude: number;
  currentLongitude: number;
  direction: 'forward' | 'backward';
  speed: number; // km/h, estimated
  confidence: number; // 0-1, based on data quality
  lastUpdate: number;
  nextStationId?: string;
  nextStationETA?: number; // seconds
  reportCount: number; // number of reports aggregated
  isActive: boolean; // false if stale (>5 min)
}

export interface TrainAttachment {
  userId: string;
  trainId: string;
  lineId: string;
  attachedAt: number;
  lastReportAt: number;
}

export interface SegmentSpeed {
  fromStationId: string;
  toStationId: string;
  avgSpeed: number; // km/h, rolling average
  sampleCount: number;
  lastUpdated: number;
}
