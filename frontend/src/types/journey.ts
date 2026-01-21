import type { MetroStation, MetroLine } from './metro';

export interface RouteSegment {
  station: MetroStation;
  line: MetroLine;
  sequenceNumber: number;
}

export interface Transfer {
  station: string;
  fromLine: string;
  toLine: string;
}

// Journey type matching the API response from /routes/find
export interface Journey {
  origin: MetroStation;
  destination: MetroStation;
  route: string[]; // Array of station IDs
  transfers: Transfer[];
  estimatedDuration: number; // Duration in seconds
  totalStations: number;
  nextTrainDeparture?: string;
  lineId?: string; // Primary line ID for the journey
}
