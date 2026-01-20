export interface MetroLine {
  id: string;
  name: string;
  color: string;
  displayOrder: number;
}

export interface MetroStation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  isInterchange: boolean;
}

export interface LineStation {
  id: number;
  lineId: string;
  stationId: string;
  sequenceNumber: number;
  direction: 'forward' | 'backward';
}

export interface StationConnection {
  id: number;
  fromStationId: string;
  toStationId: string;
  lineId: string;
  travelTimeSeconds: number;
  stopTimeSeconds: number;
}

export interface TrainSchedule {
  id: number;
  lineId: string;
  direction: 'forward' | 'backward';
  startStationId: string;
  endStationId: string;
  firstTrainTime: string;
  lastTrainTime: string;
  peakFrequencyMinutes: number;
  offPeakFrequencyMinutes: number;
}

export interface PeakHour {
  id: number;
  scheduleId: number;
  startTime: string;
  endTime: string;
}

export interface NearbyStation {
  station: MetroStation;
  distanceMeters: number;
  walkingTimeMinutes: number;
  lines: MetroLine[];
}
