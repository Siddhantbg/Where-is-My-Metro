import { useState, useEffect } from 'react';
import api from '../services/api';

interface City {
  id: string;
  name: string;
  displayName: string;
  country: string;
  timezone: string;
  mapCenter: { lat: number; lng: number };
  isActive: boolean;
  linesCount: number;
  stationsCount: number;
}

export function useCities() {
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCities() {
      try {
        const response = await api.get('/cities');
        setCities(response.data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load cities');
        console.error('Error fetching cities:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchCities();
  }, []);

  return { cities, loading, error };
}
