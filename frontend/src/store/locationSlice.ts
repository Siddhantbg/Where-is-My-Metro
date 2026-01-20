import { StateCreator } from 'zustand';
import { UserLocation } from '../types/tracking';
import { NearbyStation } from '../types/metro';

export interface LocationSlice {
  userLocation: UserLocation | null;
  nearbyStations: NearbyStation[];
  locationPermission: 'granted' | 'denied' | 'prompt' | null;
  isLoadingLocation: boolean;
  selectedCity: string | null; // NEW: 'delhi', 'mumbai', etc.

  setUserLocation: (location: UserLocation | null) => void;
  setNearbyStations: (stations: NearbyStation[]) => void;
  setLocationPermission: (permission: 'granted' | 'denied' | 'prompt') => void;
  setIsLoadingLocation: (isLoading: boolean) => void;
  setSelectedCity: (cityId: string | null) => void; // NEW
  clearSelectedCity: () => void; // NEW
  clearLocation: () => void;
}

export const createLocationSlice: StateCreator<LocationSlice> = (set) => ({
  userLocation: null,
  nearbyStations: [],
  locationPermission: null,
  isLoadingLocation: false,
  selectedCity: null, // NEW

  setUserLocation: (location) => set({ userLocation: location }),
  setNearbyStations: (stations) => set({ nearbyStations: stations }),
  setLocationPermission: (permission) => set({ locationPermission: permission }),
  setIsLoadingLocation: (isLoading) => set({ isLoadingLocation: isLoading }),
  setSelectedCity: (cityId) => set({ selectedCity: cityId }), // NEW
  clearSelectedCity: () => set({ selectedCity: null }), // NEW
  clearLocation: () => set({
    userLocation: null,
    nearbyStations: [],
    locationPermission: null
  }),
});
