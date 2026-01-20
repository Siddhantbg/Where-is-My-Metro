import { useState, useEffect, useCallback } from 'react';
import { metroApi } from '../services/metroApi';

export interface LiveSightingData {
  lineId: string;
  direction: 'forward' | 'backward';
  status: 'at_station' | 'in_transit' | 'unknown';
  currentStationId: string;
  currentStationName: string;
  nextStationId: string | null;
  nextStationName: string | null;
  progressPercent: number;
  confidence: 'high' | 'medium' | 'low';
  confidenceScore: number;
  lastSightingAge: number;
  estimatedArrivalNextStation: number | null;
}

interface UseLiveSightingsOptions {
  lineId: string | null;
  direction?: 'forward' | 'backward';
  enabled: boolean;
  refreshInterval?: number; // milliseconds
  maxAge?: number; // seconds
}

/**
 * Hook to fetch and manage live train position data from crowdsourced sightings
 */
export function useLiveSightings({
  lineId,
  direction,
  enabled,
  refreshInterval = 30000, // 30 seconds default
  maxAge = 600, // 10 minutes default
}: UseLiveSightingsOptions) {
  const [livePositions, setLivePositions] = useState<LiveSightingData[]>([]);
  const [hasLiveData, setHasLiveData] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchLivePositions = useCallback(async () => {
    if (!lineId || !enabled) return;

    setLoading(true);
    setError(null);

    try {
      const response = await metroApi.getTrainPositions(lineId, direction, maxAge);

      if (response.positions && response.positions.length > 0) {
        setLivePositions(response.positions);
        setHasLiveData(true);
      } else {
        setLivePositions([]);
        setHasLiveData(false);
      }

      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to fetch live train positions:', err);
      setError('Failed to fetch live data');
      setHasLiveData(false);
    } finally {
      setLoading(false);
    }
  }, [lineId, direction, enabled, maxAge]);

  // Initial fetch
  useEffect(() => {
    if (enabled && lineId) {
      fetchLivePositions();
    }
  }, [enabled, lineId, fetchLivePositions]);

  // Periodic refresh
  useEffect(() => {
    if (!enabled || !lineId) return;

    const interval = setInterval(() => {
      fetchLivePositions();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [enabled, lineId, refreshInterval, fetchLivePositions]);

  return {
    livePositions,
    hasLiveData,
    loading,
    error,
    lastUpdated,
    refetch: fetchLivePositions,
  };
}
