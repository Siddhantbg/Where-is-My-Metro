import { useState, useMemo } from 'react';
import { useStore } from '../../store';
import { formatDurationHuman } from '../../utils/time';
import { Timeline } from '../tracking/Timeline';
import { JourneyProgress } from '../tracking/JourneyProgress';
import { ReportTrainButton } from '../tracking/ReportTrainButton';
import { useTrainTracking } from '../../hooks/useTrainTracking';
import { RouteSegment } from '../../services/trainPositionCalculator';

export function RouteDisplay() {
  const { currentJourney } = useStore();
  const [isTracking, setIsTracking] = useState(false);

  // Mock train schedule data (simplified for MVP)
  const mockSchedule = {
    peakFrequencyMinutes: 3,
    offPeakFrequencyMinutes: 6,
    peakHours: [
      { start: '08:00:00', end: '10:00:00' },
      { start: '17:00:00', end: '20:00:00' },
    ],
    firstTrainTime: '06:00:00',
    lastTrainTime: '23:30:00', // Delhi Metro actual last train time
  };

  // Convert route to segments for tracking
  const segments = useMemo<RouteSegment[]>(() => {
    if (!currentJourney || !currentJourney.route) return [];

    const route = currentJourney.route as string[];
    const segs: RouteSegment[] = [];

    for (let i = 0; i < route.length - 1; i++) {
      segs.push({
        fromStationId: route[i],
        toStationId: route[i + 1],
        travelTimeSeconds: 120, // 2 minutes average (mock data)
        stopTimeSeconds: 30, // 30 seconds station stop (mock data)
      });
    }

    return segs;
  }, [currentJourney]);

  // Create stations map
  const stationsMap = useMemo(() => {
    const map = new Map();
    if (currentJourney && currentJourney.route) {
      (currentJourney.route as string[]).forEach((stationId: string) => {
        map.set(stationId, {
          id: stationId,
          name: stationId
            .replace(/^delhi-/, '')
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' '),
          isInterchange: false,
        });
      });
    }
    return map;
  }, [currentJourney]);

  const {
    trainPosition,
    currentTime,
    departureTime,
    isTracking: trackingActive,
    startTracking,
    stopTracking,
    resetTracking,
  } = useTrainTracking({
    route: (currentJourney?.route as string[]) || [],
    segments,
    schedule: mockSchedule,
    autoStart: false,
  });

  if (!currentJourney) {
    return null;
  }

  const { route, transfers, estimatedDuration, nextTrainDeparture } = currentJourney as any;

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleStartTracking = () => {
    setIsTracking(true);
    startTracking();
  };

  const handleStopTracking = () => {
    setIsTracking(false);
    stopTracking();
  };

  const handleResetTracking = () => {
    setIsTracking(false);
    resetTracking();
  };

  return (
    <div className="space-y-4 mt-4">
      {/* Journey Summary Card */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          Your Journey
        </h2>

        {/* Journey summary */}
        <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-blue-50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {formatDurationHuman(estimatedDuration)}
            </div>
            <div className="text-xs text-gray-600 mt-1">Duration</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {route.length - 1}
            </div>
            <div className="text-xs text-gray-600 mt-1">
              {route.length - 1 === 1 ? 'Stop' : 'Stops'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {transfers.length}
            </div>
            <div className="text-xs text-gray-600 mt-1">
              {transfers.length === 1 ? 'Transfer' : 'Transfers'}
            </div>
          </div>
        </div>

        {/* Next train or Metro closed message */}
        {!isTracking && (
          <>
            {departureTime ? (
              <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  🚇 Next train: <span className="font-semibold">{formatTime(departureTime.toISOString())}</span>
                </p>
              </div>
            ) : (
              <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">
                  ⏰ Metro not operating (Operating hours: 6:00 AM - 11:30 PM)
                </p>
              </div>
            )}
          </>
        )}

        {/* Tracking Controls */}
        <div className="flex gap-2">
          {!isTracking ? (
            <button
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all shadow-md ${
                departureTime
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              onClick={handleStartTracking}
              disabled={!departureTime}
              title={!departureTime ? 'Metro is not operating at this time' : 'Start tracking your journey'}
            >
              🚇 Start Live Tracking
            </button>
          ) : (
            <>
              <button
                className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white py-3 px-4 rounded-lg font-medium hover:from-red-700 hover:to-red-800 transition-all shadow-md"
                onClick={handleStopTracking}
              >
                ⏸️ Stop Tracking
              </button>
              <button
                className="px-6 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300 transition-all"
                onClick={handleResetTracking}
              >
                🔄 Reset
              </button>
            </>
          )}
        </div>
      </div>

      {/* Live Tracking Display */}
      {isTracking && trainPosition && (
        <>
          {/* Journey Progress Card */}
          <JourneyProgress
            trainPosition={trainPosition}
            departureTime={departureTime}
            currentTime={currentTime}
            totalStations={route.length}
          />

          {/* Timeline Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">
              Live Train Position
            </h3>
            <Timeline
              route={route}
              stations={stationsMap}
              trainPosition={trainPosition}
              transfers={transfers || []}
            />
          </div>
        </>
      )}

      {/* Static Route Display (when not tracking) */}
      {!isTracking && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="font-medium text-gray-700 mb-3">Route Details</h3>
          <div className="space-y-2">
            {route.map((stationId: string, index: number) => {
              const isFirst = index === 0;
              const isLast = index === route.length - 1;
              const isTransfer = transfers.some((t: any) => t.station === stationId);

              return (
                <div key={stationId} className="relative">
                  {/* Connection line */}
                  {!isLast && (
                    <div className="absolute left-4 top-8 w-0.5 h-8 bg-blue-300"></div>
                  )}

                  {/* Station */}
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        isFirst
                          ? 'bg-green-500'
                          : isLast
                          ? 'bg-red-500'
                          : isTransfer
                          ? 'bg-yellow-500'
                          : 'bg-blue-500'
                      }`}
                    >
                      {isFirst ? (
                        <span className="text-white text-sm font-bold">A</span>
                      ) : isLast ? (
                        <span className="text-white text-sm font-bold">B</span>
                      ) : isTransfer ? (
                        <svg
                          className="w-4 h-4 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M8 5a1 1 0 100 2h5.586l-1.293 1.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L13.586 5H8zM12 15a1 1 0 100-2H6.414l1.293-1.293a1 1 0 10-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L6.414 15H12z" />
                        </svg>
                      ) : (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>

                    <div className="flex-1 pb-6">
                      <p className="font-medium text-gray-900 capitalize">
                        {stationId
                          .replace(/^delhi-/, '')
                          .replace(/-/g, ' ')}
                      </p>
                      {isFirst && (
                        <p className="text-sm text-green-600 mt-1">Origin</p>
                      )}
                      {isLast && (
                        <p className="text-sm text-red-600 mt-1">Destination</p>
                      )}
                      {isTransfer && (
                        <p className="text-sm text-yellow-600 mt-1">
                          Change trains here
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Report Train Button (shows during tracking) */}
      {isTracking && trainPosition && (
        <ReportTrainButton
          currentStationId={route[trainPosition.currentStationIndex]}
          lineId={currentJourney.lineId}
        />
      )}
    </div>
  );
}
