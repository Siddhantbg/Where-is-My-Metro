import { StateCreator } from 'zustand';
import { TrainInstance } from '../types/tracking';

export interface TrackingSlice {
  trackedTrain: TrainInstance | null;
  isTracking: boolean;
  lastUpdateTime: Date | null;

  setTrackedTrain: (train: TrainInstance | null) => void;
  setIsTracking: (isTracking: boolean) => void;
  setLastUpdateTime: (time: Date) => void;
  stopTracking: () => void;
}

export const createTrackingSlice: StateCreator<TrackingSlice> = (set) => ({
  trackedTrain: null,
  isTracking: false,
  lastUpdateTime: null,

  setTrackedTrain: (train) => set({ trackedTrain: train }),
  setIsTracking: (isTracking) => set({ isTracking: isTracking }),
  setLastUpdateTime: (time) => set({ lastUpdateTime: time }),
  stopTracking: () => set({
    trackedTrain: null,
    isTracking: false,
    lastUpdateTime: null
  }),
});
