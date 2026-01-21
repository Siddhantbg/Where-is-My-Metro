import { useEffect, useRef, useState, useCallback } from 'react';

interface LiveTrainData {
  trainId: string;
  lineId: string;
  cityId: string;
  currentLatitude: number;
  currentLongitude: number;
  direction: 'forward' | 'backward';
  speed: number;
  confidence: number;
  lastUpdate: number;
  nextStationId?: string;
  nextStationETA?: number;
  reportCount: number;
  isActive: boolean;
}

/**
 * Hook to track a train in real-time
 */
export function useTrainTracking(trainId: string | null) {
  const [train, setTrain] = useState<LiveTrainData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<number | null>(null);

  const fetchTrainData = useCallback(async () => {
    if (!trainId) return;

    try {
      const response = await fetch(`/api/live/trains/${trainId}`);
      const data = await response.json();

      if (data.success && data.train) {
        setTrain(data.train);
        setError(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch train data');
    }
  }, [trainId]);

  useEffect(() => {
    if (!trainId) return;

    setLoading(true);
    fetchTrainData();

    // Poll for updates every 5 seconds
    intervalRef.current = setInterval(fetchTrainData, 5000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [trainId, fetchTrainData]);

  return { train, loading, error };
}

/**
 * Hook to report your train location (onboard)
 */
export function useTrainReporter(
  trainId: string | null,
  lineId: string | null,
  cityId: string | null,
  direction: 'forward' | 'backward' | null,
  enabled: boolean = false
) {
  const [isReporting, setIsReporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled || !trainId || !lineId || !cityId || !direction) return;

    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      return;
    }

    setIsReporting(true);

    // Watch position and report every 30 seconds
    const reportInterval = setInterval(async () => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            await fetch('/api/live/trains/report', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                trainId,
                lineId,
                cityId,
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                direction,
                source: 'onboard',
                accuracy: position.coords.accuracy,
                userId: `user-${Date.now()}`, // Simple user ID; use real auth in production
              }),
            });
          } catch (err) {
            console.error('Failed to report train location:', err);
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          setError(error.message);
        }
      );
    }, 30000); // Report every 30 seconds

    return () => {
      clearInterval(reportInterval);
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [enabled, trainId, lineId, cityId, direction]);

  return { isReporting, error };
}

/**
 * Hook to fetch live trains on a line
 */
export function useLineLiveTrains(lineId: string | null, direction?: 'forward' | 'backward') {
  const [trains, setTrains] = useState<LiveTrainData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<number | null>(null);

  const fetchTrains = useCallback(async () => {
    if (!lineId) return;

    try {
      setLoading(true);
      const url = direction
        ? `/api/live/trains/${lineId}/direction/${direction}`
        : `/api/live/trains?lineId=${lineId}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.success && Array.isArray(data.trains)) {
        setTrains(data.trains);
        setError(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch trains');
    } finally {
      setLoading(false);
    }
  }, [lineId, direction]);

  useEffect(() => {
    if (!lineId) return;

    fetchTrains();

    // Poll every 10 seconds
    intervalRef.current = setInterval(fetchTrains, 10000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [lineId, direction, fetchTrains]);

  return { trains, loading, error };
}

/**
 * Hook to attach/detach from a train for live location sharing
 */
export function useTrainAttachment(
  trainId: string | null,
  enabled: boolean = false,
  userId: string = `user-${Date.now()}`
) {
  const [isAttached, setIsAttached] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const attach = useCallback(async () => {
    if (!trainId) return;

    try {
      const response = await fetch('/api/live/trains/attach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          trainId,
          lineId: trainId.split('-')[0], // Extract lineId from trainId
          cityId: trainId.split('-')[1],
        }),
      });

      const data = await response.json();
      if (data.success) {
        setIsAttached(true);
        setError(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to attach to train');
    }
  }, [trainId, userId]);

  const detach = useCallback(async () => {
    if (!trainId) return;

    try {
      const response = await fetch('/api/live/trains/detach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          trainId,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setIsAttached(false);
        setError(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to detach from train');
    }
  }, [trainId, userId]);

  useEffect(() => {
    if (enabled) {
      attach();
    }
  }, [enabled, attach]);

  return { isAttached, attach, detach, error };
}
