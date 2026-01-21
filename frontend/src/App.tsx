import { useState } from 'react';
import { useStore } from './store';
import { useGeolocation } from './hooks/useGeolocation';
import { useNearbyStations } from './hooks/useNearbyStations';
import { LocationPermission } from './components/location/LocationPermission';
import { CitySelect } from './components/location/CitySelect';
import { NearbyStations } from './components/location/NearbyStations';
import { JourneyPlanner } from './components/journey/JourneyPlanner';
import { RouteDisplay } from './components/journey/RouteDisplay';
import { MapView } from './components/map/MapView';
import { DataValidator } from './components/admin';
import { InTransitTracker } from './components/tracking/InTransitTracker';
import { MapPin, AlertCircle } from 'lucide-react';

function App() {
  const { 
    userLocation, 
    nearbyStations, 
    currentJourney, 
    setOrigin, 
    selectedCity, 
    setSelectedCity,
    clearJourney,
  } = useStore();
  const { location } = useGeolocation();
  const [showManualSelect, setShowManualSelect] = useState(false);
  const [showCitySelect, setShowCitySelect] = useState(false);
  const [showCitySuccess, setShowCitySuccess] = useState(false);
  const [isChangingLocation, setIsChangingLocation] = useState(false);
  const [showLocationChangeWarning, setShowLocationChangeWarning] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);

  // Fetch nearby stations when location is available
  useNearbyStations(
    location?.latitude,
    location?.longitude,
    { autoFetch: true }
  );

  const handleManualSelect = () => {
    setShowManualSelect(true);
    setShowCitySelect(true);
  };

  const handleCitySelect = (cityId: string) => {
    // Clear journey only if this is a location change (not first-time selection)
    if (isChangingLocation && selectedCity && selectedCity !== cityId) {
      clearJourney();
    }
    
    setSelectedCity(cityId);
    setShowCitySelect(false);
    setIsChangingLocation(false);
    setShowCitySuccess(true);

    // Hide success animation after 2 seconds
    setTimeout(() => {
      setShowCitySuccess(false);
    }, 2000);
  };

  const handleCloseCitySelect = () => {
    setShowCitySelect(false);
  };

  const handleChangeLocation = () => {
    setShowLocationChangeWarning(true);
  };

  const handleConfirmLocationChange = () => {
    setShowLocationChangeWarning(false);
    setIsChangingLocation(true);
    setShowCitySelect(true);
  };

  const handleCancelLocationChange = () => {
    setShowLocationChangeWarning(false);
    setIsChangingLocation(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
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
              <h1 className="text-2xl font-bold text-gray-900">
                Where is My Metro
              </h1>
            </div>
            <div className="flex items-center gap-4">
              {selectedCity && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {selectedCity === 'delhi' ? 'Delhi' : selectedCity}
                  </span>
                  <button
                    onClick={handleChangeLocation}
                    className="ml-2 px-3 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-full font-medium transition-colors"
                  >
                    Change
                  </button>
                </div>
              )}
              <div className="text-sm text-gray-600">
                Multi‑City Metro Navigator
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Location change confirmation dialog */}
      {showLocationChangeWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full mx-4 animate-scale-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-orange-100">
                <AlertCircle className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">Change Location?</h3>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Changing your location will reset your current route. You'll need to plan a new journey in the selected city.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleCancelLocationChange}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmLocationChange}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors"
              >
                Change Location
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Location Permission Dialog - only show if no city selected yet */}
      {!selectedCity && !showManualSelect && (
        <LocationPermission onManualSelect={handleManualSelect} />
      )}

      {/* City Selection Modal */}
      {showCitySelect && (
        <CitySelect
          onCitySelect={handleCitySelect}
          onClose={handleCloseCitySelect}
        />
      )}

      {/* City Selection Success Animation */}
      {showCitySuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center animate-scale-in">
            {/* Animated Checkmark */}
            <div className="mb-4 flex justify-center">
              <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center animate-check-scale">
                <svg
                  className="w-12 h-12 text-white animate-check-draw"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="3"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            {/* Success Message */}
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Location Set!
            </h3>
            <p className="text-gray-600">
              {selectedCity === 'delhi' ? 'Delhi Metro' : selectedCity}
            </p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel: Controls */}
          <aside className="space-y-6">
            {/* Nearby Stations */}
            {userLocation && nearbyStations.length > 0 && (
              <NearbyStations
                onSelectStation={(station) => {
                  setOrigin(station);
                }}
              />
            )}

            {/* Journey Planner */}
            <JourneyPlanner />

            {/* Route Display */}
            {currentJourney && <RouteDisplay />}

            {/* Helper Info */}
            {!userLocation && showManualSelect && !selectedCity && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800 mb-2">
                  ℹ️ Please select your city to continue
                </p>
                <button
                  onClick={() => setShowCitySelect(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                >
                  Select City
                </button>
              </div>
            )}
            {!userLocation && showManualSelect && selectedCity && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  ℹ️ You can search for any metro station to plan your journey
                </p>
              </div>
            )}

            {/* Data Validator (Go Service) - Admin Tool */}
            <DataValidator />
          </aside>

          {/* Right Panel: Map */}
          <section className="bg-white rounded-lg shadow-md p-6 h-full flex flex-col">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Metro Map</h2>
                <p className="text-sm text-gray-600 mt-1">
                  See your location and nearby stations on the network map.
                </p>
              </div>
              <button
                onClick={() => setIsMapOpen(true)}
                className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Open Map
              </button>
            </div>

            {isMapOpen ? (
              <div className="relative mt-4 flex-1 min-h-[420px]">
                <button
                  aria-label="Close map"
                  onClick={() => setIsMapOpen(false)}
                  className="absolute right-3 top-3 z-[1000] grid h-10 w-10 place-items-center rounded-full bg-white/90 shadow-md ring-1 ring-gray-200 hover:bg-white"
                >
                  <span className="text-xl font-semibold text-gray-700">×</span>
                </button>
                <div className="h-full overflow-hidden rounded-lg ring-1 ring-gray-200">
                  <MapView
                    userLocation={userLocation}
                    nearbyStations={nearbyStations}
                  />
                </div>
              </div>
            ) : (
              <div className="mt-4 flex-1 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-10 text-center text-sm text-gray-600">
                Click "Open Map" to load the interactive map. Use the map to locate yourself
                and spot nearby stations. You can close it anytime with the × button.
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-600">
            <p>
              Made with ❤️ for metro commuters everywhere
            </p>
            <p className="mt-2 text-xs text-gray-500">
              Plan routes across cities • Live status where available
            </p>
          </div>
        </div>
      </footer>

      {/* In-Transit Tracker */}
      <InTransitTracker />
    </div>
  );
}

export default App;
