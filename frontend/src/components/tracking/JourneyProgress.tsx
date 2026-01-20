import { TrainPosition } from '../../services/trainPositionCalculator';
import { formatTimeRemaining } from '../../services/trainPositionCalculator';

interface JourneyProgressProps {
  trainPosition: TrainPosition | null;
  departureTime: Date | null;
  currentTime: Date;
  totalStations: number;
}

export function JourneyProgress({
  trainPosition,
  departureTime,
  currentTime,
  totalStations,
}: JourneyProgressProps) {
  if (!trainPosition || !departureTime) {
    return null;
  }

  const getStatusMessage = (): string => {
    switch (trainPosition.status) {
      case 'waiting':
        const waitTime = Math.max(0, (departureTime.getTime() - currentTime.getTime()) / 1000);
        return `Next train departs in ${formatTimeRemaining(waitTime)}`;
      case 'at_station':
        return 'Train at station';
      case 'in_transit':
        return 'Train in transit';
      case 'arrived':
        return 'Journey completed!';
      default:
        return 'Calculating...';
    }
  };

  const getTimeRemaining = (): string | null => {
    if (trainPosition.status === 'arrived' || !trainPosition.estimatedArrival) {
      return null;
    }

    const remaining = Math.max(0, (trainPosition.estimatedArrival.getTime() - currentTime.getTime()) / 1000);
    return formatTimeRemaining(remaining);
  };

  const progressPercent = ((totalStations - trainPosition.stationsRemaining - 1) / (totalStations - 1)) * 100;
  const timeRemaining = getTimeRemaining();

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
      {/* Status Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Journey Progress</h3>
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            trainPosition.status === 'arrived'
              ? 'bg-green-100 text-green-800'
              : trainPosition.status === 'in_transit'
              ? 'bg-blue-100 text-blue-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {getStatusMessage()}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Progress</span>
          <span className="font-medium text-gray-900">{Math.round(progressPercent)}%</span>
        </div>
        <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-1000 ease-linear"
            style={{ width: `${progressPercent}%` }}
          >
            {/* Animated shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-shimmer" />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
        {/* Stations Remaining */}
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {trainPosition.stationsRemaining}
          </div>
          <div className="text-xs text-gray-600 mt-1">
            {trainPosition.stationsRemaining === 1 ? 'Station' : 'Stations'} Left
          </div>
        </div>

        {/* Estimated Arrival */}
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">
            {timeRemaining || '--'}
          </div>
          <div className="text-xs text-gray-600 mt-1">
            {trainPosition.status === 'arrived' ? 'Completed' : 'ETA'}
          </div>
        </div>

        {/* Current Position */}
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {trainPosition.currentStationIndex + 1}/{totalStations}
          </div>
          <div className="text-xs text-gray-600 mt-1">Current</div>
        </div>
      </div>

      {/* Arrival Time (if not arrived) */}
      {trainPosition.status !== 'arrived' && trainPosition.estimatedArrival && (
        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Expected Arrival</span>
            <span className="font-medium text-gray-900">
              {trainPosition.estimatedArrival.toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
