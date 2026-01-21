package validators

import (
	"fmt"
	"metro-tools/internal/database"
	"regexp"
	"strings"
)

// hexColorRegex matches valid hex color codes
var hexColorRegex = regexp.MustCompile(`^#[0-9A-Fa-f]{6}$`)

// ValidateLines validates all metro lines in the database
func ValidateLines(lines []database.MetroLine, cities []database.City, stationCounts map[string]int) *Result {
	result := NewResult("line")
	seen := make(map[string]bool)

	// Build set of valid city IDs
	validCityIDs := make(map[string]bool)
	for _, city := range cities {
		validCityIDs[city.ID] = true
	}

	for _, line := range lines {
		valid := true

		// Check for duplicate IDs
		if seen[line.ID] {
			result.AddError(line.ID, "Duplicate line ID")
			valid = false
		}
		seen[line.ID] = true

		// Validate CityID references an existing city
		if !validCityIDs[line.CityID] {
			result.AddError(line.ID, fmt.Sprintf("CityID '%s' does not exist", line.CityID))
			valid = false
		}

		// Validate name is not empty
		if strings.TrimSpace(line.Name) == "" {
			result.AddError(line.ID, "Line name is empty")
			valid = false
		}

		// Validate hex color code
		if !hexColorRegex.MatchString(line.Color) {
			result.AddError(line.ID, fmt.Sprintf("Invalid hex color '%s' (expected format: #RRGGBB)", line.Color))
			valid = false
		}

		// Validate display order is positive
		if line.DisplayOrder < 0 {
			result.AddWarning(line.ID, fmt.Sprintf("Display order %d is negative", line.DisplayOrder))
		}

		// Validate line has at least 2 stations
		if count, ok := stationCounts[line.ID]; ok {
			if count < 2 {
				result.AddError(line.ID, fmt.Sprintf("Line has only %d station(s), minimum is 2", count))
				valid = false
			}
		} else {
			result.AddError(line.ID, "Line has no stations")
			valid = false
		}

		if valid {
			result.AddPass()
		}
	}

	return result
}
