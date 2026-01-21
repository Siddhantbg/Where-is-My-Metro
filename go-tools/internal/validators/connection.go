package validators

import (
	"fmt"
	"metro-tools/internal/database"
)

const (
	MinTravelTime = 30  // seconds
	MaxTravelTime = 600 // seconds (10 minutes)
	MinStopTime   = 10  // seconds
	MaxStopTime   = 120 // seconds
)

// ValidateConnections validates all station connections in the database
func ValidateConnections(
	connections []database.StationConnection,
	stations []database.MetroStation,
	lines []database.MetroLine,
	lineStations []database.LineStation,
) *Result {
	result := NewResult("connection")

	// Build lookup maps
	stationIDs := make(map[string]bool)
	for _, s := range stations {
		stationIDs[s.ID] = true
	}

	lineIDs := make(map[string]bool)
	for _, l := range lines {
		lineIDs[l.ID] = true
	}

	// Build a map of which stations belong to which lines
	stationLines := make(map[string]map[string]bool)
	for _, ls := range lineStations {
		if stationLines[ls.StationID] == nil {
			stationLines[ls.StationID] = make(map[string]bool)
		}
		stationLines[ls.StationID][ls.LineID] = true
	}

	// Build a set of existing connections for bidirectional check
	connectionSet := make(map[string]bool)
	for _, c := range connections {
		key := fmt.Sprintf("%s->%s@%s", c.FromStationID, c.ToStationID, c.LineID)
		connectionSet[key] = true
	}

	for _, conn := range connections {
		valid := true
		connID := fmt.Sprintf("%d", conn.ID)

		// Validate FromStationID exists
		if !stationIDs[conn.FromStationID] {
			result.AddError(connID, fmt.Sprintf("FromStationID '%s' does not exist", conn.FromStationID))
			valid = false
		}

		// Validate ToStationID exists
		if !stationIDs[conn.ToStationID] {
			result.AddError(connID, fmt.Sprintf("ToStationID '%s' does not exist", conn.ToStationID))
			valid = false
		}

		// Validate LineID exists
		if !lineIDs[conn.LineID] {
			result.AddError(connID, fmt.Sprintf("LineID '%s' does not exist", conn.LineID))
			valid = false
		}

		// Check for self-connection
		if conn.FromStationID == conn.ToStationID {
			result.AddError(connID, "Self-connection detected (from == to)")
			valid = false
		}

		// Validate both stations belong to the line
		if fromLines, ok := stationLines[conn.FromStationID]; ok {
			if !fromLines[conn.LineID] {
				result.AddError(connID, fmt.Sprintf("FromStation '%s' does not belong to line '%s'", conn.FromStationID, conn.LineID))
				valid = false
			}
		}
		if toLines, ok := stationLines[conn.ToStationID]; ok {
			if !toLines[conn.LineID] {
				result.AddError(connID, fmt.Sprintf("ToStation '%s' does not belong to line '%s'", conn.ToStationID, conn.LineID))
				valid = false
			}
		}

		// Validate travel time range
		if conn.TravelTimeSeconds < MinTravelTime {
			result.AddWarning(connID, fmt.Sprintf("Travel time %ds is below minimum %ds", conn.TravelTimeSeconds, MinTravelTime))
		}
		if conn.TravelTimeSeconds > MaxTravelTime {
			result.AddWarning(connID, fmt.Sprintf("Travel time %ds exceeds recommended maximum %ds", conn.TravelTimeSeconds, MaxTravelTime))
		}

		// Validate stop time range
		if conn.StopTimeSeconds < MinStopTime {
			result.AddWarning(connID, fmt.Sprintf("Stop time %ds is below minimum %ds", conn.StopTimeSeconds, MinStopTime))
		}
		if conn.StopTimeSeconds > MaxStopTime {
			result.AddWarning(connID, fmt.Sprintf("Stop time %ds exceeds recommended maximum %ds", conn.StopTimeSeconds, MaxStopTime))
		}

		// Check for bidirectional connection (warning only)
		reverseKey := fmt.Sprintf("%s->%s@%s", conn.ToStationID, conn.FromStationID, conn.LineID)
		if !connectionSet[reverseKey] {
			result.AddWarning(connID, fmt.Sprintf("Missing reverse connection: %s -> %s on %s", conn.ToStationID, conn.FromStationID, conn.LineID))
		}

		if valid {
			result.AddPass()
		}
	}

	return result
}
