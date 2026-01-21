import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { LocationSlice, createLocationSlice } from './locationSlice';
import { JourneySlice, createJourneySlice } from './journeySlice';
import { TrackingSlice, createTrackingSlice } from './trackingSlice';

type StoreState = LocationSlice & JourneySlice & TrackingSlice;

export const useStore = create<StoreState>()(
  devtools(
    persist(
      (...a) => ({
        ...createLocationSlice(...a),
        ...createJourneySlice(...a),
        ...createTrackingSlice(...a),
      }),
      {
        name: 'metro-tracker-storage',
        partialize: (state) => ({
          // Persist minimal session info so refresh keeps context
          locationPermission: state.locationPermission,
          selectedCity: state.selectedCity,
          origin: state.origin,
          destination: state.destination,
          currentJourney: state.currentJourney,
        }),
      }
    )
  )
);

export default useStore;
