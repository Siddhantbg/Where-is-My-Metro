import { StateCreator } from 'zustand';
import { Journey } from '../types/journey';
import { MetroStation } from '../types/metro';

export interface JourneySlice {
  origin: MetroStation | null;
  destination: MetroStation | null;
  currentJourney: Journey | null;
  isCalculatingRoute: boolean;

  setOrigin: (station: MetroStation | null) => void;
  setDestination: (station: MetroStation | null) => void;
  setCurrentJourney: (journey: Journey | null) => void;
  setIsCalculatingRoute: (isCalculating: boolean) => void;
  clearJourney: () => void;
}

export const createJourneySlice: StateCreator<JourneySlice> = (set) => ({
  origin: null,
  destination: null,
  currentJourney: null,
  isCalculatingRoute: false,

  setOrigin: (station) => set({ origin: station }),
  setDestination: (station) => set({ destination: station }),
  setCurrentJourney: (journey) => set({ currentJourney: journey }),
  setIsCalculatingRoute: (isCalculating) => set({ isCalculatingRoute: isCalculating }),
  clearJourney: () => set({
    origin: null,
    destination: null,
    currentJourney: null
  }),
});
