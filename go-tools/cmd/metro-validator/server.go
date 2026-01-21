package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"metro-tools/internal/database"
	"metro-tools/internal/validators"
)

// ServerConfig holds the server configuration
type ServerConfig struct {
	Port   string
	DBPath string
}

// ValidationResponse is the API response format
type ValidationResponse struct {
	Success   bool                          `json:"success"`
	Database  string                        `json:"database"`
	Timestamp string                        `json:"timestamp"`
	Stats     *database.Stats               `json:"stats,omitempty"`
	Results   map[string]*validators.Result `json:"results,omitempty"`
	Issues    []validators.Issue            `json:"issues,omitempty"`
	Status    string                        `json:"status"`
	Error     string                        `json:"error,omitempty"`
}

// runServer starts the HTTP server
func runServer(config ServerConfig) {
	mux := http.NewServeMux()

	// Health check endpoint
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{
			"status":  "ok",
			"service": "metro-validator",
			"version": version,
		})
	})

	// Validation endpoint
	mux.HandleFunc("/api/validate", func(w http.ResponseWriter, r *http.Request) {
		handleValidation(w, r, config.DBPath)
	})

	// CORS middleware wrapper
	handler := corsMiddleware(mux)

	fmt.Printf("\n  🚀 Metro Validator Server v%s\n", version)
	fmt.Printf("  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")
	fmt.Printf("  Database: %s\n", config.DBPath)
	fmt.Printf("  Server:   http://localhost:%s\n", config.Port)
	fmt.Printf("  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n")
	fmt.Printf("  Endpoints:\n")
	fmt.Printf("    GET  /health        - Health check\n")
	fmt.Printf("    GET  /api/validate  - Run validation\n\n")

	log.Fatal(http.ListenAndServe(":"+config.Port, handler))
}

// corsMiddleware adds CORS headers for frontend access
func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Allow requests from common frontend dev ports and production
		origin := r.Header.Get("Origin")
		allowedOrigins := map[string]bool{
			"http://localhost:5173":                        true, // Vite dev server
			"http://localhost:3000":                        true, // Common React port
			"http://localhost:4173":                        true, // Vite preview
			"https://where-is-my-metro-nine.vercel.app":    true, // Production frontend
		}

		if allowedOrigins[origin] {
			w.Header().Set("Access-Control-Allow-Origin", origin)
		}

		w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// handleValidation runs the validation and returns JSON response
func handleValidation(w http.ResponseWriter, r *http.Request, dbPath string) {
	w.Header().Set("Content-Type", "application/json")

	response := ValidationResponse{
		Database:  dbPath,
		Timestamp: time.Now().UTC().Format(time.RFC3339),
	}

	// Open database
	db, err := database.Open(dbPath)
	if err != nil {
		response.Success = false
		response.Status = "error"
		response.Error = fmt.Sprintf("Failed to open database: %v", err)
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(response)
		return
	}
	defer db.Close()

	// Get statistics
	stats, err := db.GetStats()
	if err != nil {
		response.Success = false
		response.Status = "error"
		response.Error = fmt.Sprintf("Failed to get stats: %v", err)
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(response)
		return
	}
	response.Stats = stats

	// Load all data
	cities, _ := db.GetAllCities()
	lines, _ := db.GetAllLines()
	stations, _ := db.GetAllStations()
	lineStations, _ := db.GetAllLineStations()
	connections, _ := db.GetAllConnections()
	stationCounts, _ := db.GetStationCountByLine()
	linesPerStation, _ := db.GetLinesPerStation()

	// Run validations
	results := make(map[string]*validators.Result)
	results["city"] = validators.ValidateCities(cities)
	results["line"] = validators.ValidateLines(lines, cities, stationCounts)
	results["station"] = validators.ValidateStations(stations, cities)
	results["connection"] = validators.ValidateConnections(connections, stations, lines, lineStations)
	results["interchange"] = validators.ValidateInterchanges(stations, linesPerStation)

	response.Results = results

	// Collect all issues
	var allIssues []validators.Issue
	for _, res := range results {
		allIssues = append(allIssues, res.Issues...)
	}
	response.Issues = allIssues

	// Determine status
	hasErrors := false
	hasWarnings := false
	for _, res := range results {
		if res.Failed > 0 {
			hasErrors = true
		}
		if res.Warnings > 0 {
			hasWarnings = true
		}
	}

	response.Success = !hasErrors
	if hasErrors {
		response.Status = "fail"
	} else if hasWarnings {
		response.Status = "pass_with_warnings"
	} else {
		response.Status = "pass"
	}

	json.NewEncoder(w).Encode(response)
}

// getEnv gets an environment variable with a default fallback
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
