import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import { Icon, LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { UserLocation } from '../../types/tracking';
import { NearbyStation } from '../../types/metro';

interface MapViewProps {
  userLocation: UserLocation | null;
  nearbyStations: NearbyStation[];
  center?: LatLngExpression;
  zoom?: number;
}

// Default center: Delhi (Connaught Place)
const DEFAULT_CENTER: LatLngExpression = [28.6304, 77.2177];
const DEFAULT_ZOOM = 13;

// Create custom marker icon for user location
const userLocationIcon = new Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="8" fill="#3B82F6" stroke="white" stroke-width="3"/>
    </svg>
  `),
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12],
});

// Create custom marker icon for metro stations
const createStationIcon = (color: string = '#0066B3') => new Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="12" fill="${color}" stroke="white" stroke-width="3"/>
      <path d="M10 14h12M10 18h12m-6-4v8m-4 0h8" stroke="white" stroke-width="2" stroke-linecap="round"/>
    </svg>
  `),
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
});

export function MapView({
  userLocation,
  nearbyStations,
  center,
  zoom = DEFAULT_ZOOM,
}: MapViewProps) {
  // Determine map center
  const mapCenter: LatLngExpression = center
    ? center
    : userLocation
    ? [userLocation.latitude, userLocation.longitude]
    : DEFAULT_CENTER;

  return (
    <div className="h-full w-full">
      <MapContainer
        center={mapCenter}
        zoom={zoom}
        className="h-full w-full rounded-lg shadow-lg"
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* User location marker */}
        {userLocation && (
          <>
            <Marker
              position={[userLocation.latitude, userLocation.longitude]}
              icon={userLocationIcon}
            >
              <Popup>
                <div className="text-center">
                  <p className="font-semibold">Your Location</p>
                  <p className="text-sm text-gray-600">
                    Accuracy: ±{Math.round(userLocation.accuracy)}m
                  </p>
                </div>
              </Popup>
            </Marker>

            {/* Accuracy circle */}
            <Circle
              center={[userLocation.latitude, userLocation.longitude]}
              radius={userLocation.accuracy}
              pathOptions={{
                color: '#3B82F6',
                fillColor: '#3B82F6',
                fillOpacity: 0.1,
                weight: 1,
              }}
            />
          </>
        )}

        {/* Nearby station markers */}
        {nearbyStations.map(({ station, distanceMeters, walkingTimeMinutes }) => (
          <Marker
            key={station.id}
            position={[station.latitude, station.longitude]}
            icon={createStationIcon('#0066B3')}
          >
            <Popup>
              <div className="min-w-[200px]">
                <h3 className="font-semibold text-base mb-1">{station.name}</h3>
                {station.isInterchange && (
                  <span className="inline-block text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded mb-2">
                    Interchange Station
                  </span>
                )}
                <div className="text-sm text-gray-600 space-y-1">
                  <p>
                    📍 {(distanceMeters / 1000).toFixed(2)} km away
                  </p>
                  <p>
                    🚶 {walkingTimeMinutes} min walk
                  </p>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
