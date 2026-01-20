/**
 * Train Position Calculator
 *
 * Calculates the current position of a metro train based on:
 * - Route segments (station-to-station connections)
 * - Travel times between stations
 * - Station dwell times
 * - Departure time
 * - Current time
 */

export interface TrainPosition {
  status: 'waiting' | 'at_station' | 'in_transit' | 'arrived';
  currentStationIndex: number;
  nextStationIndex: number | null;
  progressPercent: number; // 0-100 for in_transit, 0 for at_station
  estimatedArrival: Date | null;
  stationsRemaining: number;
}

export interface RouteSegment {
  fromStationId: string;
  toStationId: string;
  travelTimeSeconds: number;
  stopTimeSeconds: number;
}

/**
 * Calculate train position based on schedule and current time
 */
export function calculateTrainPosition(
  departureTime: Date,
  currentTime: Date,
  route: string[], // Array of station IDs in order
  segments: RouteSegment[]
): TrainPosition {
  const elapsedSeconds = (currentTime.getTime() - departureTime.getTime()) / 1000;

  // If departure time is in the future, train is waiting
  if (elapsedSeconds < 0) {
    return {
      status: 'waiting',
      currentStationIndex: 0,
      nextStationIndex: 1,
      progressPercent: 0,
      estimatedArrival: calculateArrivalTime(departureTime, segments),
      stationsRemaining: route.length - 1,
    };
  }

  let cumulativeTime = 0;

  // Walk through each segment to find current position
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    const segmentTotalTime = segment.stopTimeSeconds + segment.travelTimeSeconds;
    const segmentElapsedTime = elapsedSeconds - cumulativeTime;

    // Check if train is in this segment
    if (segmentElapsedTime < segmentTotalTime) {
      // Train is at current station (dwelling)
      if (segmentElapsedTime < segment.stopTimeSeconds) {
        return {
          status: 'at_station',
          currentStationIndex: i,
          nextStationIndex: i + 1,
          progressPercent: 0,
          estimatedArrival: calculateArrivalTime(departureTime, segments),
          stationsRemaining: route.length - i - 1,
        };
      }

      // Train is in transit between stations
      const transitElapsed = segmentElapsedTime - segment.stopTimeSeconds;
      const progressPercent = (transitElapsed / segment.travelTimeSeconds) * 100;

      return {
        status: 'in_transit',
        currentStationIndex: i,
        nextStationIndex: i + 1,
        progressPercent: Math.min(100, progressPercent),
        estimatedArrival: calculateArrivalTime(departureTime, segments),
        stationsRemaining: route.length - i - 1,
      };
    }

    cumulativeTime += segmentTotalTime;
  }

  // Train has arrived at destination
  return {
    status: 'arrived',
    currentStationIndex: route.length - 1,
    nextStationIndex: null,
    progressPercent: 0,
    estimatedArrival: null,
    stationsRemaining: 0,
  };
}

/**
 * Calculate total arrival time at destination
 */
function calculateArrivalTime(
  departureTime: Date,
  segments: RouteSegment[]
): Date {
  const totalSeconds = segments.reduce(
    (sum, seg) => sum + seg.stopTimeSeconds + seg.travelTimeSeconds,
    0
  );

  return new Date(departureTime.getTime() + totalSeconds * 1000);
}

/**
 * Calculate next train departure time based on frequency
 */
export function calculateNextTrain(
  currentTime: Date,
  frequency: {
    peakFrequencyMinutes: number;
    offPeakFrequencyMinutes: number;
    peakHours: Array<{ start: string; end: string }>;
    firstTrainTime: string; // "06:00:00"
    lastTrainTime: string;  // "23:30:00" (actual last train time)
  }
): Date | null {
  const currentHour = currentTime.getHours();
  const currentMinute = currentTime.getMinutes();
  const currentTimeMinutes = currentHour * 60 + currentMinute;

  // Parse operating hours
  const [firstHour, firstMin] = frequency.firstTrainTime.split(':').map(Number);
  const [lastHour, lastMin] = frequency.lastTrainTime.split(':').map(Number);
  const firstTimeMinutes = firstHour * 60 + firstMin;
  const lastTimeMinutes = lastHour * 60 + lastMin;

  // Check if within operating hours
  if (currentTimeMinutes < firstTimeMinutes || currentTimeMinutes > lastTimeMinutes) {
    return null; // No trains running - metro is closed
  }

  // Get current time as string for peak hour comparison
  const currentTimeString = currentTime.toTimeString().slice(0, 8);

  // Determine if peak or off-peak
  const isPeakHour = frequency.peakHours.some(peak =>
    currentTimeString >= peak.start && currentTimeString <= peak.end
  );

  const frequencyMinutes = isPeakHour
    ? frequency.peakFrequencyMinutes
    : frequency.offPeakFrequencyMinutes;

  // Calculate next departure (simplified: assumes trains depart at regular intervals)
  const minutesSinceFirst = getMinutesSince(frequency.firstTrainTime, currentTimeString);
  const trainNumber = Math.ceil(minutesSinceFirst / frequencyMinutes);
  const nextDepartureMinutes = trainNumber * frequencyMinutes;

  const nextDeparture = new Date(currentTime);
  const firstTrainParts = frequency.firstTrainTime.split(':').map(Number);
  nextDeparture.setHours(firstTrainParts[0], firstTrainParts[1], firstTrainParts[2], 0);
  nextDeparture.setMinutes(nextDeparture.getMinutes() + nextDepartureMinutes);

  return nextDeparture;
}

/**
 * Helper: Calculate minutes between two time strings
 */
function getMinutesSince(startTime: string, currentTime: string): number {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [currHour, currMin] = currentTime.split(':').map(Number);

  return (currHour * 60 + currMin) - (startHour * 60 + startMin);
}

/**
 * Format time remaining for display
 */
export function formatTimeRemaining(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);

  if (minutes < 60) {
    return remainingSeconds > 0
      ? `${minutes}m ${remainingSeconds}s`
      : `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return `${hours}h ${remainingMinutes}m`;
}
