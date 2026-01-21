package database

import (
	"database/sql"
	"encoding/json"
	"fmt"

	_ "modernc.org/sqlite"
)

// Models matching the Drizzle schema

type City struct {
	ID          string
	Name        string
	DisplayName string
	Country     string
	Timezone    string
	MapCenter   string // JSON string: {"lat": 28.6, "lng": 77.2}
	IsActive    bool
}

type MapCenter struct {
	Lat float64 `json:"lat"`
	Lng float64 `json:"lng"`
}

func (c *City) ParseMapCenter() (*MapCenter, error) {
	var mc MapCenter
	if err := json.Unmarshal([]byte(c.MapCenter), &mc); err != nil {
		return nil, fmt.Errorf("invalid map_center JSON: %w", err)
	}
	return &mc, nil
}

type MetroLine struct {
	ID           string
	CityID       string
	Name         string
	Color        string
	DisplayOrder int
}

type MetroStation struct {
	ID            string
	CityID        string
	Name          string
	Latitude      float64
	Longitude     float64
	IsInterchange bool
}

type LineStation struct {
	ID             int
	LineID         string
	StationID      string
	SequenceNumber int
	Direction      string
}

type StationConnection struct {
	ID                int
	FromStationID     string
	ToStationID       string
	LineID            string
	TravelTimeSeconds int
	StopTimeSeconds   int
}

// DB wraps the database connection
type DB struct {
	conn *sql.DB
}

// Open opens a connection to the SQLite database
func Open(dbPath string) (*DB, error) {
	conn, err := sql.Open("sqlite", dbPath+"?mode=ro")
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	// Test the connection
	if err := conn.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	return &DB{conn: conn}, nil
}

// Close closes the database connection
func (db *DB) Close() error {
	return db.conn.Close()
}

// GetAllCities retrieves all cities from the database
func (db *DB) GetAllCities() ([]City, error) {
	rows, err := db.conn.Query(`
		SELECT id, name, display_name, country, timezone, map_center, is_active
		FROM cities
	`)
	if err != nil {
		return nil, fmt.Errorf("failed to query cities: %w", err)
	}
	defer rows.Close()

	var cities []City
	for rows.Next() {
		var c City
		var isActive int
		if err := rows.Scan(&c.ID, &c.Name, &c.DisplayName, &c.Country, &c.Timezone, &c.MapCenter, &isActive); err != nil {
			return nil, fmt.Errorf("failed to scan city: %w", err)
		}
		c.IsActive = isActive == 1
		cities = append(cities, c)
	}
	return cities, rows.Err()
}

// GetAllLines retrieves all metro lines from the database
func (db *DB) GetAllLines() ([]MetroLine, error) {
	rows, err := db.conn.Query(`
		SELECT id, city_id, name, color, display_order
		FROM metro_lines
	`)
	if err != nil {
		return nil, fmt.Errorf("failed to query lines: %w", err)
	}
	defer rows.Close()

	var lines []MetroLine
	for rows.Next() {
		var l MetroLine
		if err := rows.Scan(&l.ID, &l.CityID, &l.Name, &l.Color, &l.DisplayOrder); err != nil {
			return nil, fmt.Errorf("failed to scan line: %w", err)
		}
		lines = append(lines, l)
	}
	return lines, rows.Err()
}

// GetAllStations retrieves all metro stations from the database
func (db *DB) GetAllStations() ([]MetroStation, error) {
	rows, err := db.conn.Query(`
		SELECT id, city_id, name, latitude, longitude, is_interchange
		FROM metro_stations
	`)
	if err != nil {
		return nil, fmt.Errorf("failed to query stations: %w", err)
	}
	defer rows.Close()

	var stations []MetroStation
	for rows.Next() {
		var s MetroStation
		var isInterchange int
		if err := rows.Scan(&s.ID, &s.CityID, &s.Name, &s.Latitude, &s.Longitude, &isInterchange); err != nil {
			return nil, fmt.Errorf("failed to scan station: %w", err)
		}
		s.IsInterchange = isInterchange == 1
		stations = append(stations, s)
	}
	return stations, rows.Err()
}

// GetAllLineStations retrieves all line-station relationships
func (db *DB) GetAllLineStations() ([]LineStation, error) {
	rows, err := db.conn.Query(`
		SELECT id, line_id, station_id, sequence_number, direction
		FROM line_stations
	`)
	if err != nil {
		return nil, fmt.Errorf("failed to query line_stations: %w", err)
	}
	defer rows.Close()

	var lineStations []LineStation
	for rows.Next() {
		var ls LineStation
		if err := rows.Scan(&ls.ID, &ls.LineID, &ls.StationID, &ls.SequenceNumber, &ls.Direction); err != nil {
			return nil, fmt.Errorf("failed to scan line_station: %w", err)
		}
		lineStations = append(lineStations, ls)
	}
	return lineStations, rows.Err()
}

// GetAllConnections retrieves all station connections
func (db *DB) GetAllConnections() ([]StationConnection, error) {
	rows, err := db.conn.Query(`
		SELECT id, from_station_id, to_station_id, line_id, travel_time_seconds, stop_time_seconds
		FROM station_connections
	`)
	if err != nil {
		return nil, fmt.Errorf("failed to query connections: %w", err)
	}
	defer rows.Close()

	var connections []StationConnection
	for rows.Next() {
		var c StationConnection
		if err := rows.Scan(&c.ID, &c.FromStationID, &c.ToStationID, &c.LineID, &c.TravelTimeSeconds, &c.StopTimeSeconds); err != nil {
			return nil, fmt.Errorf("failed to scan connection: %w", err)
		}
		connections = append(connections, c)
	}
	return connections, rows.Err()
}

// GetStationCountByLine returns the count of stations per line
func (db *DB) GetStationCountByLine() (map[string]int, error) {
	rows, err := db.conn.Query(`
		SELECT line_id, COUNT(DISTINCT station_id) as count
		FROM line_stations
		GROUP BY line_id
	`)
	if err != nil {
		return nil, fmt.Errorf("failed to query station counts: %w", err)
	}
	defer rows.Close()

	counts := make(map[string]int)
	for rows.Next() {
		var lineID string
		var count int
		if err := rows.Scan(&lineID, &count); err != nil {
			return nil, fmt.Errorf("failed to scan count: %w", err)
		}
		counts[lineID] = count
	}
	return counts, rows.Err()
}

// GetLinesPerStation returns the lines each station belongs to
func (db *DB) GetLinesPerStation() (map[string][]string, error) {
	rows, err := db.conn.Query(`
		SELECT station_id, line_id
		FROM line_stations
		GROUP BY station_id, line_id
	`)
	if err != nil {
		return nil, fmt.Errorf("failed to query lines per station: %w", err)
	}
	defer rows.Close()

	linesMap := make(map[string][]string)
	for rows.Next() {
		var stationID, lineID string
		if err := rows.Scan(&stationID, &lineID); err != nil {
			return nil, fmt.Errorf("failed to scan: %w", err)
		}
		linesMap[stationID] = append(linesMap[stationID], lineID)
	}
	return linesMap, rows.Err()
}

// Stats holds database statistics
type Stats struct {
	Cities      int
	Lines       int
	Stations    int
	Connections int
}

// GetStats returns database statistics
func (db *DB) GetStats() (*Stats, error) {
	var stats Stats

	err := db.conn.QueryRow("SELECT COUNT(*) FROM cities").Scan(&stats.Cities)
	if err != nil {
		return nil, err
	}

	err = db.conn.QueryRow("SELECT COUNT(*) FROM metro_lines").Scan(&stats.Lines)
	if err != nil {
		return nil, err
	}

	err = db.conn.QueryRow("SELECT COUNT(*) FROM metro_stations").Scan(&stats.Stations)
	if err != nil {
		return nil, err
	}

	err = db.conn.QueryRow("SELECT COUNT(*) FROM station_connections").Scan(&stats.Connections)
	if err != nil {
		return nil, err
	}

	return &stats, nil
}
