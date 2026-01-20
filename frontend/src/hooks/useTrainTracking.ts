import { useState, useEffect, useCallback } from 'react';
import {
  calculateTrainPosition,
  calculateNextTrain,
  TrainPosition,
  RouteSegment,
} from '../services/trainPositionCalculator';

interface TrainSchedule {
  peakFrequencyMinutes: number;
  offPeakFrequencyMinutes: number;
  peakHours: Array<{ start: string; end: string }>;
  firstTrainTime: string;
  lastTrainTime: string;
}

interface UseTrainTrackingOptions {
  route: string[];
  segments: RouteSegment[];
  departureTime?: Date;
  schedule?: TrainSchedule;
  autoStart?: boolean;
}

export function useTrainTracking({
  route,
  segments,
  departureTime,
  schedule,
  autoStart = true,
}: UseTrainTrackingOptions) {
  const [trainPosition, setTrainPosition] = useState<TrainPosition | null>(null);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [isTracking, setIsTracking] = useState(autoStart);
  const [calculatedDeparture, setCalculatedDeparture] = useState<Date | null>(
    departureTime || null
  );

  // Calculate next train if no departure time provided
  useEffect(() => {
    if (!departureTime && schedule && !calculatedDeparture) {
      const nextTrain = calculateNextTrain(new Date(), schedule);
      setCalculatedDeparture(nextTrain);
    }
  }, [departureTime, schedule, calculatedDeparture]);

  // Calculate train position
  const updatePosition = useCallback(() => {
    const departure = departureTime || calculatedDeparture;
    if (!departure || route.length === 0 || segments.length === 0) {
      return;
    }

    const now = new Date();
    const position = calculateTrainPosition(departure, now, route, segments);
    setTrainPosition(position);
    setCurrentTime(now);

    // Stop tracking if train has arrived
    if (position.status === 'arrived') {
      setIsTracking(false);
    }
  }, [departureTime, calculatedDeparture, route, segments]);

  // Update every 5 seconds when tracking is active
  useEffect(() => {
    if (!isTracking) {
      return;
    }

    // Initial update
    updatePosition();

    // Set up interval for 5-second updates
    const interval = setInterval(updatePosition, 5000);

    return () => clearInterval(interval);
  }, [isTracking, updatePosition]);

  // Control functions
  const startTracking = useCallback(() => {
    setIsTracking(true);
  }, []);

  const stopTracking = useCallback(() => {
    setIsTracking(false);
  }, []);

  const resetTracking = useCallback(() => {
    setTrainPosition(null);
    setCalculatedDeparture(null);
    if (schedule) {
      const nextTrain = calculateNextTrain(new Date(), schedule);
      setCalculatedDeparture(nextTrain);
    }
    setIsTracking(autoStart);
  }, [schedule, autoStart]);

  return {
    trainPosition,
    currentTime,
    departureTime: departureTime || calculatedDeparture,
    isTracking,
    startTracking,
    stopTracking,
    resetTracking,
  };
}
