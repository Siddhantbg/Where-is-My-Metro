package validators

import (
	"fmt"
	"math"
	"metro-tools/internal/database"
	"strings"
)

// haversineDistance calculates the distance in km between two coordinates
func haversineDistance(lat1, lng1, lat2, lng2 float64) float64 {
	const earthRadius = 6371.0 // km

	lat1Rad := lat1 * math.Pi / 180
	lat2Rad := lat2 * math.Pi / 180
	deltaLat := (lat2 - lat1) * math.Pi / 180
	deltaLng := (lng2 - lng1) * math.Pi / 180

	a := math.Sin(deltaLat/2)*math.Sin(deltaLat/2) +
		math.Cos(lat1Rad)*math.Cos(lat2Rad)*
			math.Sin(deltaLng/2)*math.Sin(deltaLng/2)
	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))

	return earthRadius * c
}

// ValidateStations validates all stations in the database
func ValidateStations(stations []database.MetroStation, cities []database.City) *Result {
	result := NewResult("station")
	seen := make(map[string]bool)

	// Build city lookup map with parsed coordinates
	cityMap := make(map[string]*database.MapCenter)
	cityNames := make(map[string]string)
	for _, city := range cities {
		mc, err := city.ParseMapCenter()
		if err == nil {
			cityMap[city.ID] = mc
			cityNames[city.ID] = city.Name
		}
	}

	// Build set of valid city IDs
	validCityIDs := make(map[string]bool)
	for _, city := range cities {
		validCityIDs[city.ID] = true
	}

	for _, station := range stations {
		valid := true

		// Check for duplicate IDs
		if seen[station.ID] {
			result.AddError(station.ID, "Duplicate station ID")
			valid = false
		}
		seen[station.ID] = true

		// Validate CityID references an existing city
		if !validCityIDs[station.CityID] {
			result.AddError(station.ID, fmt.Sprintf("CityID '%s' does not exist", station.CityID))
			valid = false
		}

		// Validate name is not empty
		if strings.TrimSpace(station.Name) == "" {
			result.AddError(station.ID, "Station name is empty")
			valid = false
		}

		// Validate latitude range
		if station.Latitude < -90 || station.Latitude > 90 {
			result.AddError(station.ID, fmt.Sprintf("Latitude %f out of range [-90, 90]", station.Latitude))
			valid = false
		}

		// Validate longitude range
		if station.Longitude < -180 || station.Longitude > 180 {
			result.AddError(station.ID, fmt.Sprintf("Longitude %f out of range [-180, 180]", station.Longitude))
			valid = false
		}

		// Check if coordinates are roughly in India (warning)
		if station.Latitude < 8 || station.Latitude > 37 || station.Longitude < 68 || station.Longitude > 97 {
			result.AddWarning(station.ID, fmt.Sprintf("Coordinates (%.4f, %.4f) appear to be outside India", station.Latitude, station.Longitude))
		}

		// Check distance from city center (should be within 50km)
		if cityCenter, ok := cityMap[station.CityID]; ok {
			distance := haversineDistance(station.Latitude, station.Longitude, cityCenter.Lat, cityCenter.Lng)
			if distance > 50 {
				result.AddError(station.ID, fmt.Sprintf("Station is %.1f km from %s city center (max 50km)", distance, cityNames[station.CityID]))
				valid = false
			} else if distance > 30 {
				result.AddWarning(station.ID, fmt.Sprintf("Station is %.1f km from %s city center", distance, cityNames[station.CityID]))
			}
		}

		if valid {
			result.AddPass()
		}
	}

	return result
}
