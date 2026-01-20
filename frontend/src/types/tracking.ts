import type { MetroStation } from './metro';

export type TrainStatus = 'at_station' | 'in_transit' | 'arrived' | 'upcoming';

export interface TrainPosition {
  fromStation: MetroStation;
  toStation: MetroStation | null;
  progressPercent: number;
  status: TrainStatus;
}

export interface TrainInstance {
  trainId: string;
  lineId: string;
  direction: 'forward' | 'backward';
  departureTime: Date;
  currentPosition: TrainPosition;
  estimatedArrival: Date;
}

export interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: Date;
  isManualSelection: boolean;
}
