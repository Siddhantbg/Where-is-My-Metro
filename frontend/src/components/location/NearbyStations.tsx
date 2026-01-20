import { useStore } from '../../store';
import { formatDistance } from '../../utils/distance';
import { MetroStation } from '../../types/metro';

interface NearbyStationsProps {
  onSelectStation: (station: MetroStation) => void;
}

export function NearbyStations({ onSelectStation }: NearbyStationsProps) {
  const { nearbyStations, isLoadingLocation } = useStore();

  if (isLoadingLocation) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          Nearby Stations
        </h2>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse flex items-center gap-3 p-3 rounded-lg bg-gray-100"
            >
              <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-300 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!nearbyStations || nearbyStations.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          Nearby Stations
        </h2>
        <div className="text-center py-8">
          <svg
            className="mx-auto w-16 h-16 text-gray-400 mb-4"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          <p className="text-gray-600">No metro stations found nearby</p>
          <p className="text-sm text-gray-500 mt-2">
            Try searching for a station manually
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800">
          Nearby Stations
        </h2>
        <span className="text-sm text-gray-500">
          {nearbyStations.length} {nearbyStations.length === 1 ? 'station' : 'stations'}
        </span>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {nearbyStations.map(({ station, distanceMeters, walkingTimeMinutes }) => (
          <button
            key={station.id}
            onClick={() => onSelectStation(station)}
            className="w-full text-left flex items-center gap-3 p-3 rounded-lg hover:bg-blue-50 transition-colors border border-transparent hover:border-blue-200"
          >
            <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-gray-900 truncate">
                  {station.name}
                </p>
                {station.isInterchange && (
                  <span className="flex-shrink-0 text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                    Interchange
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {formatDistance(distanceMeters)} • {walkingTimeMinutes} min walk
              </p>
            </div>

            <svg
              className="w-5 h-5 text-gray-400"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
}
