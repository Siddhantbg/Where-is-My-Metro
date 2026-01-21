package validators

import (
	"fmt"
	"metro-tools/internal/database"
)

// ValidateInterchanges validates interchange station consistency
func ValidateInterchanges(stations []database.MetroStation, linesPerStation map[string][]string) *Result {
	result := NewResult("interchange")

	for _, station := range stations {
		valid := true
		lineCount := len(linesPerStation[station.ID])

		// Case 1: Station is marked as interchange but only has 1 line
		if station.IsInterchange && lineCount < 2 {
			result.AddError(station.ID, fmt.Sprintf("Marked as interchange but only on %d line(s)", lineCount))
			valid = false
		}

		// Case 2: Station has multiple lines but not marked as interchange
		if !station.IsInterchange && lineCount >= 2 {
			result.AddWarning(station.ID, fmt.Sprintf("On %d lines but not marked as interchange", lineCount))
		}

		// Case 3: Station has 0 lines (orphan)
		if lineCount == 0 {
			result.AddError(station.ID, "Station is not assigned to any line (orphan)")
			valid = false
		}

		if valid {
			result.AddPass()
		}
	}

	return result
}
