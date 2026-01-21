import { StateCreator } from 'zustand';

export interface InTransitModeState {
  inTransitMode: boolean;
  inTransitLineId: string | null;
  inTransitDirection: 'forward' | 'backward' | null;
  activeTrainId: string | null;
  isReportingLocation: boolean;

  setInTransitMode: (enabled: boolean) => void;
  setInTransitLine: (lineId: string | null, direction: 'forward' | 'backward' | null) => void;
  setActiveTrainId: (trainId: string | null) => void;
  setIsReportingLocation: (reporting: boolean) => void;
  clearInTransitSession: () => void;
}

export const createInTransitModeSlice: StateCreator<InTransitModeState> = (set) => ({
  inTransitMode: false,
  inTransitLineId: null,
  inTransitDirection: null,
  activeTrainId: null,
  isReportingLocation: false,

  setInTransitMode: (enabled) => set({ inTransitMode: enabled }),
  setInTransitLine: (lineId, direction) =>
    set({
      inTransitLineId: lineId,
      inTransitDirection: direction,
    }),
  setActiveTrainId: (trainId) => set({ activeTrainId: trainId }),
  setIsReportingLocation: (reporting) => set({ isReportingLocation: reporting }),
  clearInTransitSession: () =>
    set({
      inTransitMode: false,
      inTransitLineId: null,
      inTransitDirection: null,
      activeTrainId: null,
      isReportingLocation: false,
    }),
});
