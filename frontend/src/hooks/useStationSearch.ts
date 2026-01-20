import { useState, useEffect, useCallback } from 'react';
import { metroApi } from '../services/metroApi';
import { MetroStation } from '../types/metro';

interface UseStationSearchOptions {
  debounceMs?: number;
  lineId?: string;
}

export function useStationSearch(options: UseStationSearchOptions = {}) {
  const { debounceMs = 300, lineId } = options;

  const [query, setQuery] = useState('');
  const [allStations, setAllStations] = useState<MetroStation[]>([]);
  const [results, setResults] = useState<MetroStation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all stations once on mount
  useEffect(() => {
    const fetchStations = async () => {
      try {
        setLoading(true);
        const stations = await metroApi.getStations(lineId);
        setAllStations(stations);
        setResults(stations); // Show all initially
        setError(null);
      } catch (err) {
        console.error('Error fetching stations:', err);
        setError('Failed to fetch stations');
      } finally {
        setLoading(false);
      }
    };

    fetchStations();
  }, [lineId]);

  // Debounced search filter
  useEffect(() => {
    if (!query.trim()) {
      setResults(allStations);
      return;
    }

    const timeoutId = setTimeout(() => {
      const searchQuery = query.toLowerCase().trim();
      const filtered = allStations.filter((station) =>
        station.name.toLowerCase().includes(searchQuery)
      );
      setResults(filtered);
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [query, allStations, debounceMs]);

  const clearSearch = useCallback(() => {
    setQuery('');
    setResults(allStations);
  }, [allStations]);

  return {
    query,
    setQuery,
    results,
    loading,
    error,
    clearSearch,
    allStations,
  };
}
