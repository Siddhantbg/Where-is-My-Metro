import { useState, useEffect } from 'react';
import { metroApi } from '../services/metroApi';
import { useStore } from '../store';
import { distanceToWalkingTime } from '../utils/distance';
import { NearbyStation } from '../types/metro';

interface UseNearbyStationsOptions {
  radius?: number;
  autoFetch?: boolean;
}

export function useNearbyStations(
  lat?: number,
  lng?: number,
  options: UseNearbyStationsOptions = {}
) {
  const { radius = 2000, autoFetch = true } = options;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { setNearbyStations } = useStore();

  const fetchNearbyStations = async (latitude: number, longitude: number) => {
    setLoading(true);
    setError(null);

    try {
      const data = await metroApi.getNearbyStations(latitude, longitude, radius);

      // Transform data to include walking times
      const nearbyStations: NearbyStation[] = data.map((station: any) => {
        const distanceMeters = station.distance || 0;
        return {
          station: {
            id: station.id,
            name: station.name,
            latitude: station.latitude,
            longitude: station.longitude,
            isInterchange: station.isInterchange || station.is_interchange,
          },
          distanceMeters,
          walkingTimeMinutes: distanceToWalkingTime(distanceMeters),
          lines: [], // Will be populated later when we fetch line data
        };
      });

      setNearbyStations(nearbyStations);
      setLoading(false);
      return nearbyStations;
    } catch (err) {
      console.error('Error fetching nearby stations:', err);
      setError('Failed to fetch nearby stations');
      setLoading(false);
      return [];
    }
  };

  // Auto-fetch when lat/lng are provided
  useEffect(() => {
    if (autoFetch && lat !== undefined && lng !== undefined) {
      fetchNearbyStations(lat, lng);
    }
  }, [lat, lng, radius, autoFetch]);

  return {
    loading,
    error,
    fetchNearbyStations,
  };
}
