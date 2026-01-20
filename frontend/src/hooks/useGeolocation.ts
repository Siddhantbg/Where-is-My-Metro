import { useState, useEffect, useCallback } from 'react';
import { useStore } from '../store';
import { UserLocation } from '../types/tracking';

interface GeolocationState {
  location: UserLocation | null;
  error: string | null;
  loading: boolean;
  hasPermission: PermissionState | null;
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    location: null,
    error: null,
    loading: false,
    hasPermission: null,
  });

  const { setUserLocation, setLocationPermission } = useStore();

  // Check if geolocation is available
  const isAvailable = 'geolocation' in navigator;

  // Request location permission and get current position
  const requestLocation = useCallback(() => {
    if (!isAvailable) {
      setState(prev => ({
        ...prev,
        error: 'Geolocation is not supported by your browser',
      }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLocation: UserLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date(position.timestamp),
          isManualSelection: false,
        };

        setState({
          location: userLocation,
          error: null,
          loading: false,
          hasPermission: 'granted',
        });

        // Update Zustand store
        setUserLocation(userLocation);
        setLocationPermission('granted');
      },
      (error) => {
        let errorMessage = 'Failed to get location';

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied';
            setLocationPermission('denied');
            setState(prev => ({
              ...prev,
              error: errorMessage,
              loading: false,
              hasPermission: 'denied',
            }));
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            setState(prev => ({
              ...prev,
              error: errorMessage,
              loading: false,
            }));
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            setState(prev => ({
              ...prev,
              error: errorMessage,
              loading: false,
            }));
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, [isAvailable, setUserLocation, setLocationPermission]);

  // Check permission status on mount
  useEffect(() => {
    if (!isAvailable) return;

    // Check if Permissions API is available
    if ('permissions' in navigator) {
      navigator.permissions
        .query({ name: 'geolocation' })
        .then((permissionStatus) => {
          setState(prev => ({
            ...prev,
            hasPermission: permissionStatus.state,
          }));

          // Listen for permission changes
          permissionStatus.addEventListener('change', () => {
            setState(prev => ({
              ...prev,
              hasPermission: permissionStatus.state,
            }));
            setLocationPermission(permissionStatus.state);
          });
        })
        .catch(() => {
          // Permissions API not supported, use prompt state
          setState(prev => ({
            ...prev,
            hasPermission: 'prompt',
          }));
        });
    }
  }, [isAvailable, setLocationPermission]);

  return {
    location: state.location,
    error: state.error,
    loading: state.loading,
    hasPermission: state.hasPermission,
    isAvailable,
    requestLocation,
  };
}
