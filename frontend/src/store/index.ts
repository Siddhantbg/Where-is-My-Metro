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
          // Only persist location permission, not full location data
          locationPermission: state.locationPermission,
        }),
      }
    )
  )
);

export default useStore;
