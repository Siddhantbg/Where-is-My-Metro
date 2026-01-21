import { useEffect, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import api from '../../services/api';

interface City {
  id: string;
  name: string;
  displayName: string;
  country: string;
  timezone: string;
  mapCenter: { lat: number; lng: number };
  isActive: boolean;
  linesCount: number;
  stationsCount: number;
}

interface CitySelectProps {
  onCitySelect: (cityId: string) => void;
  onClose: () => void;
}

export function CitySelect({ onCitySelect, onClose }: CitySelectProps) {
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCities() {
      try {
        const response = await api.get('/cities');
        setCities(response.data);
      } catch (err) {
        setError('Failed to load cities. Please try again.');
        console.error('Error fetching cities:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchCities();
  }, []);

  const handleCityClick = (cityId: string) => {
    onCitySelect(cityId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-bold text-gray-900">Select Your City</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-gray-600">
            Choose your metro city to plan your journey
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
              {error}
            </div>
          )}

          {!loading && !error && cities.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No cities available at the moment.
            </div>
          )}

          {!loading && !error && cities.length > 0 && (
            <div className="space-y-3">
              {cities.map((city) => {
                const isComingSoon = city.stationsCount === 0;
                return (
                  <button
                    key={city.id}
                    onClick={() => !isComingSoon && handleCityClick(city.id)}
                    disabled={isComingSoon}
                    className={`w-full p-4 border-2 rounded-lg transition-all duration-200 text-left group relative ${
                      isComingSoon
                        ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                        : 'border-gray-200 hover:border-blue-500 hover:bg-blue-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className={`font-bold text-lg ${
                            isComingSoon
                              ? 'text-gray-500'
                              : 'text-gray-900 group-hover:text-blue-600'
                          } transition-colors`}>
                            {city.displayName}
                          </h3>
                          {isComingSoon && (
                            <span className="px-2 py-1 text-xs font-semibold bg-amber-100 text-amber-800 rounded-full">
                              Coming Soon
                            </span>
                          )}
                        </div>
                        <p className={`text-sm mt-1 ${isComingSoon ? 'text-gray-400' : 'text-gray-600'}`}>
                          {isComingSoon
                            ? 'Data not available yet'
                            : `${city.linesCount} ${city.linesCount === 1 ? 'line' : 'lines'} • ${city.stationsCount} stations`
                          }
                        </p>
                      </div>
                      {!isComingSoon && (
                        <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-blue-600 transition-colors" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
