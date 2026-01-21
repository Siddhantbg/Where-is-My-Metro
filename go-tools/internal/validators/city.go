package validators

import (
	"fmt"
	"metro-tools/internal/database"
	"strings"
)

// ValidTimezones contains common Indian timezones
var ValidTimezones = map[string]bool{
	"Asia/Kolkata": true,
	"Asia/Delhi":   true,
	"Asia/Mumbai":  true,
	"UTC":          true,
}

// ValidateCities validates all cities in the database
func ValidateCities(cities []database.City) *Result {
	result := NewResult("city")
	seen := make(map[string]bool)

	for _, city := range cities {
		valid := true

		// Check for duplicate IDs
		if seen[city.ID] {
			result.AddError(city.ID, "Duplicate city ID")
			valid = false
		}
		seen[city.ID] = true

		// Validate MapCenter JSON
		mc, err := city.ParseMapCenter()
		if err != nil {
			result.AddError(city.ID, fmt.Sprintf("Invalid map_center JSON: %v", err))
			valid = false
		} else {
			// Validate latitude range (-90 to 90)
			if mc.Lat < -90 || mc.Lat > 90 {
				result.AddError(city.ID, fmt.Sprintf("Latitude %f out of range [-90, 90]", mc.Lat))
				valid = false
			}

			// Validate longitude range (-180 to 180)
			if mc.Lng < -180 || mc.Lng > 180 {
				result.AddError(city.ID, fmt.Sprintf("Longitude %f out of range [-180, 180]", mc.Lng))
				valid = false
			}

			// Validate coordinates are roughly in India (warning only)
			if mc.Lat < 8 || mc.Lat > 37 || mc.Lng < 68 || mc.Lng > 97 {
				result.AddWarning(city.ID, fmt.Sprintf("Coordinates (%.4f, %.4f) appear to be outside India", mc.Lat, mc.Lng))
			}
		}

		// Validate timezone (warning only)
		if !ValidTimezones[city.Timezone] {
			result.AddWarning(city.ID, fmt.Sprintf("Timezone '%s' may not be valid", city.Timezone))
		}

		// Validate name is not empty
		if strings.TrimSpace(city.Name) == "" {
			result.AddError(city.ID, "City name is empty")
			valid = false
		}

		// Validate display name is not empty
		if strings.TrimSpace(city.DisplayName) == "" {
			result.AddError(city.ID, "City display name is empty")
			valid = false
		}

		if valid {
			result.AddPass()
		}
	}

	return result
}
