import { Signal, Clock, MapPin } from 'lucide-react';
import { formatTimeRemaining } from '../../services/trainPositionCalculator';

interface LiveSightingBannerProps {
  livePosition: {
    status: 'at_station' | 'in_transit' | 'unknown';
    currentStationName: string;
    nextStationName: string | null;
    progressPercent: number;
    confidence: 'high' | 'medium' | 'low';
    confidenceScore: number;
    lastSightingAge: number;
    estimatedArrivalNextStation: number | null;
  };
  lastUpdated: Date | null;
}

export function LiveSightingBanner({ livePosition, lastUpdated }: LiveSightingBannerProps) {
  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusMessage = () => {
    if (livePosition.status === 'at_station') {
      return `Currently at ${livePosition.currentStationName}`;
    } else if (livePosition.status === 'in_transit') {
      return `Heading to ${livePosition.nextStationName} (${Math.round(livePosition.progressPercent)}%)`;
    } else {
      return `Last seen at ${livePosition.currentStationName}`;
    }
  };

  const getConfidenceMessage = () => {
    const ageMinutes = Math.floor(livePosition.lastSightingAge / 60);
    if (ageMinutes < 1) {
      return 'Just reported';
    } else if (ageMinutes === 1) {
      return '1 minute ago';
    } else {
      return `${ageMinutes} minutes ago`;
    }
  };

  return (
    <div className={`rounded-lg border-2 p-4 ${getConfidenceColor(livePosition.confidence)}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          {/* Header */}
          <div className="flex items-center gap-2 mb-2">
            <Signal className="w-5 h-5" />
            <h4 className="font-semibold">Live Train Position</h4>
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full uppercase ${
                livePosition.confidence === 'high'
                  ? 'bg-green-200 text-green-800'
                  : livePosition.confidence === 'medium'
                  ? 'bg-yellow-200 text-yellow-800'
                  : 'bg-orange-200 text-orange-800'
              }`}
            >
              {livePosition.confidence} confidence
            </span>
          </div>

          {/* Status Message */}
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="w-4 h-4" />
            <p className="text-sm font-medium">{getStatusMessage()}</p>
          </div>

          {/* Arrival Time */}
          {livePosition.estimatedArrivalNextStation && livePosition.nextStationName && (
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4" />
              <p className="text-sm">
                Arriving at {livePosition.nextStationName} in{' '}
                <span className="font-semibold">
                  {formatTimeRemaining(livePosition.estimatedArrivalNextStation)}
                </span>
              </p>
            </div>
          )}

          {/* Last Sighting Age */}
          <p className="text-xs mt-2 opacity-75">
            📍 Last sighting: {getConfidenceMessage()}
          </p>
        </div>

        {/* Live Indicator */}
        <div className="flex flex-col items-center gap-1">
          <div className="relative">
            <div className="w-3 h-3 bg-current rounded-full animate-pulse" />
            <div className="absolute inset-0 w-3 h-3 bg-current rounded-full animate-ping opacity-75" />
          </div>
          <span className="text-xs font-medium uppercase tracking-wide">Live</span>
        </div>
      </div>

      {/* Progress Bar for in_transit */}
      {livePosition.status === 'in_transit' && (
        <div className="mt-3">
          <div className="relative w-full h-2 bg-white bg-opacity-50 rounded-full overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full bg-current rounded-full transition-all duration-1000"
              style={{ width: `${livePosition.progressPercent}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
