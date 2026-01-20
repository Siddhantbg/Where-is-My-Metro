/**
 * Format seconds to MM:SS format
 * @param seconds Total seconds
 * @returns Formatted time string
 */
export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Format seconds to human-readable format (e.g., "5 min" or "1 hr 20 min")
 * @param seconds Total seconds
 * @returns Human-readable time string
 */
export function formatDurationHuman(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours} hr ${minutes > 0 ? `${minutes} min` : ''}`;
  }
  return `${minutes} min`;
}

/**
 * Get current time in HH:MM:SS format
 * @returns Time string
 */
export function getCurrentTimeString(): string {
  const now = new Date();
  return now.toTimeString().split(' ')[0];
}

/**
 * Parse time string (HH:MM:SS) to seconds since midnight
 * @param timeString Time in HH:MM:SS format
 * @returns Seconds since midnight
 */
export function parseTimeToSeconds(timeString: string): number {
  const [hours, minutes, seconds] = timeString.split(':').map(Number);
  return hours * 3600 + minutes * 60 + (seconds || 0);
}

/**
 * Check if current time is within a time range
 * @param currentTime Current time in HH:MM:SS format
 * @param startTime Start time in HH:MM:SS format
 * @param endTime End time in HH:MM:SS format
 * @returns True if current time is within range
 */
export function isTimeInRange(
  currentTime: string,
  startTime: string,
  endTime: string
): boolean {
  const current = parseTimeToSeconds(currentTime);
  const start = parseTimeToSeconds(startTime);
  const end = parseTimeToSeconds(endTime);

  return current >= start && current <= end;
}
