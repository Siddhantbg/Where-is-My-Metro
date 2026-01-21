import { useState, useEffect } from 'react';
import { useStore } from '../../store';
import { LineSelectDropdown } from '../station/LineSelectDropdown';
import { StationSelectDropdown } from '../station/StationSelectDropdown';
import { useFindRoute } from '../../hooks/useFindRoute';
import { MetroStation, MetroLine } from '../../types/metro';
import { Zap } from 'lucide-react';

export function JourneyPlanner() {
  const { 
    origin, 
    destination, 
    isCalculatingRoute, 
    selectedCity, 
    setOrigin, 
    setDestination,
    setInTransitMode,
    setInTransitLine,
  } = useStore();
  const { findRoute, error } = useFindRoute();
  const [localOrigin, setLocalOrigin] = useState<MetroStation | null>(origin);
  const [localDestination, setLocalDestination] = useState<MetroStation | null>(destination);
  const [originLine, setOriginLine] = useState<MetroLine | null>(null);
  const [destinationLine, setDestinationLine] = useState<MetroLine | null>(null);

  // Clear all selections when city changes
  useEffect(() => {
    setLocalOrigin(null);
    setLocalDestination(null);
    setOriginLine(null);
    setDestinationLine(null);
    setOrigin(null);
    setDestination(null);
  }, [selectedCity, setOrigin, setDestination]);

  const handleOriginLineSelect = (line: MetroLine | null) => {
    setOriginLine(line);
    // Clear station selection when line changes
    if (line?.id !== originLine?.id) {
      setLocalOrigin(null);
      setOrigin(null);
    }
  };

  const handleDestinationLineSelect = (line: MetroLine | null) => {
    setDestinationLine(line);
    // Clear station selection when line changes
    if (line?.id !== destinationLine?.id) {
      setLocalDestination(null);
      setDestination(null);
    }
  };

  const handleOriginSelect = (station: MetroStation | null) => {
    setLocalOrigin(station);
    setOrigin(station);
  };

  const handleDestinationSelect = (station: MetroStation | null) => {
    setLocalDestination(station);
    setDestination(station);
  };

  const handleSwapStations = () => {
    // Swap stations
    const tempStation = localOrigin;
    setLocalOrigin(localDestination);
    setLocalDestination(tempStation);
    setOrigin(localDestination);
    setDestination(tempStation);

    // Swap lines
    const tempLine = originLine;
    setOriginLine(destinationLine);
    setDestinationLine(tempLine);
  };

  const handleFindRoute = () => {
    if (localOrigin && localDestination) {
      findRoute(localOrigin.id, localDestination.id);
    }
  };

  const canFindRoute = localOrigin && localDestination && localOrigin.id !== localDestination.id;

  const handleInTransitMode = () => {
    if (originLine) {
      setInTransitLine(originLine.id, 'forward');
      setInTransitMode(true);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800">
          Plan Your Journey
        </h2>
        {originLine && (
          <button
            onClick={handleInTransitMode}
            className="flex items-center gap-2 text-sm bg-green-50 hover:bg-green-100 text-green-700 px-3 py-1.5 rounded-lg font-medium transition-colors"
            title="Already on a train? Track live positions"
          >
            <Zap className="w-4 h-4" />
            In Transit
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* Origin */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <span className="inline-flex items-center">
              <span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span>
              From
            </span>
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <LineSelectDropdown
              placeholder="Select metro line..."
              onSelect={handleOriginLineSelect}
              selectedLine={originLine}
            />
            <StationSelectDropdown
              placeholder="Select station..."
              lineId={originLine?.id || null}
              lineColor={originLine?.color || '#000'}
              lineNumber={originLine?.displayOrder || 0}
              onSelect={handleOriginSelect}
              selectedStation={localOrigin}
              excludeStationId={localDestination?.id}
            />
          </div>
        </div>

        {/* Swap button */}
        {(localOrigin || localDestination) && (
          <div className="flex justify-center -my-2">
            <button
              onClick={handleSwapStations}
              disabled={!localOrigin || !localDestination}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Swap origin and destination"
            >
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </button>
          </div>
        )}

        {/* Destination */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <span className="inline-flex items-center">
              <span className="w-3 h-3 rounded-full bg-red-500 mr-2"></span>
              To
            </span>
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <LineSelectDropdown
              placeholder="Select metro line..."
              onSelect={handleDestinationLineSelect}
              selectedLine={destinationLine}
            />
            <StationSelectDropdown
              placeholder="Select station..."
              lineId={destinationLine?.id || null}
              lineColor={destinationLine?.color || '#000'}
              lineNumber={destinationLine?.displayOrder || 0}
              onSelect={handleDestinationSelect}
              selectedStation={localDestination}
              excludeStationId={localOrigin?.id}
            />
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Find Route button */}
        <button
          onClick={handleFindRoute}
          disabled={!canFindRoute || isCalculatingRoute}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCalculatingRoute ? (
            <span className="flex items-center justify-center">
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Finding route...
            </span>
          ) : (
            'Find Route'
          )}
        </button>

        {/* Helper text */}
        {!localOrigin && !localDestination && (
          <p className="text-sm text-gray-500 text-center">
            Select origin and destination to find the best route
          </p>
        )}
      </div>
    </div>
  );
}
