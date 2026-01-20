import type { MetroStation, MetroLine } from './metro';

export interface RouteSegment {
  station: MetroStation;
  line: MetroLine;
  sequenceNumber: number;
}

export interface Transfer {
  station: MetroStation;
  fromLine: MetroLine;
  toLine: MetroLine;
}

export interface Journey {
  origin: MetroStation;
  destination: MetroStation;
  route: RouteSegment[];
  transfers: Transfer[];
  estimatedDurationSeconds: number;
  totalStations: number;
  nextTrainDeparture?: Date;
}
