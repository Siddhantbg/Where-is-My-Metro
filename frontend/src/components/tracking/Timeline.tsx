import { MetroStation } from '../../types/metro';
import { TrainPosition } from '../../services/trainPositionCalculator';
import { TrainIndicator } from './TrainIndicator';

interface TimelineProps {
  route: string[]; // Array of station IDs
  stations: Map<string, MetroStation>; // Station ID -> Station data
  trainPosition: TrainPosition | null;
  transfers: Array<{
    station: string;
    fromLine: string;
    toLine: string;
  }>;
}

export function Timeline({ route, stations, trainPosition, transfers }: TimelineProps) {
  if (route.length === 0) {
    return null;
  }

  const getLineColor = (stationId: string): string => {
    // Default color - will be enhanced with actual line colors later
    return '#3B82F6'; // Blue
  };

  const isTransferStation = (stationId: string): boolean => {
    return transfers.some(t => t.station === stationId);
  };

  return (
    <div className="relative py-6">
      {/* Timeline Container */}
      <div className="space-y-4">
        {route.map((stationId, index) => {
          const station = stations.get(stationId);
          if (!station) return null;

          const isOrigin = index === 0;
          const isDestination = index === route.length - 1;
          const isTransfer = isTransferStation(stationId);
          const isCurrent = trainPosition?.currentStationIndex === index;
          const isPassed = trainPosition ? index < trainPosition.currentStationIndex : false;
          const isUpcoming = trainPosition ? index > trainPosition.currentStationIndex : true;

          // Train indicator position (between stations)
          const showTrain =
            trainPosition?.status === 'in_transit' &&
            trainPosition.currentStationIndex === index;

          return (
            <div key={stationId} className="relative">
              {/* Station Row */}
              <div className="flex items-center gap-4">
                {/* Station Marker */}
                <div className="relative flex items-center justify-center flex-shrink-0">
                  {/* Vertical Line (except for last station) */}
                  {!isDestination && (
                    <div
                      className={`absolute top-6 left-1/2 -translate-x-1/2 w-1 h-12 transition-colors duration-300 ${
                        isPassed ? 'bg-blue-500' : 'bg-gray-300'
                      }`}
                    />
                  )}

                  {/* Station Dot */}
                  <div
                    className={`relative z-10 w-6 h-6 rounded-full border-4 transition-all duration-300 ${
                      isOrigin || isDestination
                        ? 'w-8 h-8 border-blue-600 bg-white shadow-lg'
                        : isCurrent
                        ? 'border-blue-600 bg-blue-600 animate-pulse shadow-lg'
                        : isPassed
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300 bg-white'
                    }`}
                  >
                    {/* Transfer Indicator */}
                    {isTransfer && (
                      <div className="absolute -right-1 -top-1 w-3 h-3 bg-purple-600 rounded-full border-2 border-white" />
                    )}
                  </div>
                </div>

                {/* Station Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4
                      className={`font-semibold transition-colors duration-300 ${
                        isCurrent
                          ? 'text-blue-600 text-lg'
                          : isPassed
                          ? 'text-gray-700'
                          : 'text-gray-500'
                      }`}
                    >
                      {station.name}
                    </h4>

                    {/* Status Badges */}
                    {isOrigin && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                        Start
                      </span>
                    )}
                    {isDestination && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                        End
                      </span>
                    )}
                    {isCurrent && trainPosition?.status === 'at_station' && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full animate-pulse">
                        Train Here
                      </span>
                    )}
                  </div>

                  {/* Transfer Info */}
                  {isTransfer && (
                    <p className="text-xs text-purple-600 mt-1">
                      ⇄ Interchange Station
                    </p>
                  )}
                </div>

                {/* Sequence Number */}
                <div
                  className={`text-sm font-medium transition-colors duration-300 ${
                    isPassed ? 'text-blue-600' : 'text-gray-400'
                  }`}
                >
                  {index + 1}
                </div>
              </div>

              {/* Train Indicator (animated between stations) */}
              {showTrain && trainPosition && (
                <div className="absolute left-3 top-14 -translate-x-1/2">
                  <TrainIndicator progress={trainPosition.progressPercent} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
