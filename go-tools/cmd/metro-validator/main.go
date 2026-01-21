package main

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"

	"metro-tools/internal/database"
	"metro-tools/internal/validators"

	"github.com/fatih/color"
	"github.com/spf13/cobra"
)

const version = "1.0.0"

var (
	dbPath     string
	verbose    bool
	jsonOut    bool
	serverPort string
)

// Output helpers
var (
	green  = color.New(color.FgGreen).SprintFunc()
	red    = color.New(color.FgRed).SprintFunc()
	yellow = color.New(color.FgYellow).SprintFunc()
	cyan   = color.New(color.FgCyan).SprintFunc()
	bold   = color.New(color.Bold).SprintFunc()
	dimmed = color.New(color.Faint).SprintFunc()
)

// JSONOutput represents the JSON output structure
type JSONOutput struct {
	Database  string                        `json:"database"`
	Timestamp string                        `json:"timestamp"`
	Stats     *database.Stats               `json:"stats"`
	Results   map[string]*validators.Result `json:"results"`
	Issues    []validators.Issue            `json:"issues"`
	Status    string                        `json:"status"`
}

func main() {
	// Find default database path relative to executable
	defaultDB := findDefaultDB()

	rootCmd := &cobra.Command{
		Use:     "metro-validator",
		Short:   "Validate metro data integrity",
		Long:    "A CLI tool to validate the integrity of metro data in the SQLite database.",
		Version: version,
		Run:     runValidator,
	}

	// Global flags
	rootCmd.PersistentFlags().StringVarP(&dbPath, "db", "d", defaultDB, "Path to SQLite database")

	// Validate command flags
	rootCmd.Flags().BoolVarP(&verbose, "verbose", "v", false, "Show detailed output")
	rootCmd.Flags().BoolVar(&jsonOut, "json", false, "Output results as JSON")

	// Serve command - starts HTTP server for frontend integration
	serveCmd := &cobra.Command{
		Use:   "serve",
		Short: "Start HTTP server for frontend integration",
		Long:  "Starts an HTTP server that exposes validation as a REST API for frontend consumption.",
		Run: func(cmd *cobra.Command, args []string) {
			// Use PORT from environment if available (for cloud deployments)
			port := os.Getenv("PORT")
			if port == "" {
				port = serverPort
			}
			config := ServerConfig{
				Port:   port,
				DBPath: dbPath,
			}
			runServer(config)
		},
	}
	serveCmd.Flags().StringVarP(&serverPort, "port", "p", "5001", "Server port")
	rootCmd.AddCommand(serveCmd)

	if err := rootCmd.Execute(); err != nil {
		os.Exit(1)
	}
}

func findDefaultDB() string {
	// Try common locations relative to where the tool might be run
	candidates := []string{
		"../../backend/data/metro.db",
		"../backend/data/metro.db",
		"backend/data/metro.db",
		"./metro.db",
	}

	for _, path := range candidates {
		if _, err := os.Stat(path); err == nil {
			absPath, _ := filepath.Abs(path)
			return absPath
		}
	}

	return "../../backend/data/metro.db"
}

func runValidator(cmd *cobra.Command, args []string) {
	if !jsonOut {
		printHeader()
	}

	// Open database
	db, err := database.Open(dbPath)
	if err != nil {
		if jsonOut {
			outputError(err)
		} else {
			fmt.Printf("%s Failed to open database: %v\n", red("ERROR:"), err)
		}
		os.Exit(1)
	}
	defer db.Close()

	// Get statistics
	stats, err := db.GetStats()
	if err != nil {
		if jsonOut {
			outputError(err)
		} else {
			fmt.Printf("%s Failed to get stats: %v\n", red("ERROR:"), err)
		}
		os.Exit(1)
	}

	if !jsonOut {
		printStats(stats)
	}

	// Load all data
	cities, err := db.GetAllCities()
	if err != nil {
		handleLoadError("cities", err)
	}

	lines, err := db.GetAllLines()
	if err != nil {
		handleLoadError("lines", err)
	}

	stations, err := db.GetAllStations()
	if err != nil {
		handleLoadError("stations", err)
	}

	lineStations, err := db.GetAllLineStations()
	if err != nil {
		handleLoadError("line_stations", err)
	}

	connections, err := db.GetAllConnections()
	if err != nil {
		handleLoadError("connections", err)
	}

	stationCounts, err := db.GetStationCountByLine()
	if err != nil {
		handleLoadError("station counts", err)
	}

	linesPerStation, err := db.GetLinesPerStation()
	if err != nil {
		handleLoadError("lines per station", err)
	}

	// Run validations
	results := make(map[string]*validators.Result)

	results["city"] = validators.ValidateCities(cities)
	results["line"] = validators.ValidateLines(lines, cities, stationCounts)
	results["station"] = validators.ValidateStations(stations, cities)
	results["connection"] = validators.ValidateConnections(connections, stations, lines, lineStations)
	results["interchange"] = validators.ValidateInterchanges(stations, linesPerStation)

	// Collect all issues
	var allIssues []validators.Issue
	for _, r := range results {
		allIssues = append(allIssues, r.Issues...)
	}

	// Determine overall status
	hasErrors := false
	hasWarnings := false
	for _, r := range results {
		if r.Failed > 0 {
			hasErrors = true
		}
		if r.Warnings > 0 {
			hasWarnings = true
		}
	}

	status := "pass"
	if hasErrors {
		status = "fail"
	} else if hasWarnings {
		status = "pass_with_warnings"
	}

	// Output results
	if jsonOut {
		outputJSON(stats, results, allIssues, status)
	} else {
		printResults(results)
		printSummary(results, status)
	}

	// Exit with appropriate code
	if hasErrors {
		os.Exit(1)
	}
}

func handleLoadError(what string, err error) {
	if jsonOut {
		outputError(fmt.Errorf("failed to load %s: %w", what, err))
	} else {
		fmt.Printf("%s Failed to load %s: %v\n", red("ERROR:"), what, err)
	}
	os.Exit(1)
}

func printHeader() {
	fmt.Println()
	fmt.Printf("  %s Metro Data Validator %s\n", bold("🔍"), dimmed("v"+version))
	fmt.Println(dimmed("  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"))
	fmt.Println()
}

func printStats(stats *database.Stats) {
	fmt.Printf("  %s %s\n", cyan("Database:"), dbPath)
	fmt.Printf("  %s Cities: %d | Lines: %d | Stations: %d | Connections: %d\n",
		cyan("Stats:"),
		stats.Cities,
		stats.Lines,
		stats.Stations,
		stats.Connections,
	)
	fmt.Println()
	fmt.Println(dimmed("  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"))
	fmt.Println()
}

func printResults(results map[string]*validators.Result) {
	order := []string{"city", "line", "station", "connection", "interchange"}

	for _, category := range order {
		r := results[category]
		if r == nil {
			continue
		}

		// Determine icon
		icon := green("✓")
		if r.Failed > 0 {
			icon = red("✗")
		} else if r.Warnings > 0 {
			icon = yellow("⚠")
		}

		// Format category name
		categoryName := fmt.Sprintf("%-12s Validations", capitalize(category))

		// Format counts
		countStr := fmt.Sprintf("[%d/%d passed]", r.Passed, r.Total())
		if r.Warnings > 0 {
			countStr = fmt.Sprintf("[%d/%d passed, %d warnings]", r.Passed, r.Total(), r.Warnings)
		}

		fmt.Printf("  %s %s %s\n", icon, categoryName, dimmed(countStr))

		// Print issues if verbose or if there are errors
		if verbose || r.Failed > 0 {
			for _, issue := range r.Issues {
				if issue.Severity == validators.SeverityError {
					fmt.Printf("      %s %s: %s\n", red("└─ ERROR:"), issue.ID, issue.Message)
				} else if verbose {
					fmt.Printf("      %s %s: %s\n", yellow("└─ WARNING:"), issue.ID, issue.Message)
				}
			}
		}
	}
	fmt.Println()
}

func printSummary(results map[string]*validators.Result, status string) {
	fmt.Println(dimmed("  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"))
	fmt.Println()

	var totalErrors, totalWarnings int
	for _, r := range results {
		totalErrors += r.Failed
		totalWarnings += r.Warnings
	}

	fmt.Printf("  %s %d errors, %d warnings\n", bold("Summary:"), totalErrors, totalWarnings)

	switch status {
	case "pass":
		fmt.Printf("  %s %s\n", bold("Status:"), green("PASS"))
	case "pass_with_warnings":
		fmt.Printf("  %s %s\n", bold("Status:"), yellow("PASS (with warnings)"))
	case "fail":
		fmt.Printf("  %s %s\n", bold("Status:"), red("FAIL"))
	}
	fmt.Println()
}

func outputJSON(stats *database.Stats, results map[string]*validators.Result, issues []validators.Issue, status string) {
	output := JSONOutput{
		Database: dbPath,
		Stats:    stats,
		Results:  results,
		Issues:   issues,
		Status:   status,
	}

	encoder := json.NewEncoder(os.Stdout)
	encoder.SetIndent("", "  ")
	encoder.Encode(output)
}

func outputError(err error) {
	output := map[string]string{
		"error": err.Error(),
	}
	encoder := json.NewEncoder(os.Stdout)
	encoder.SetIndent("", "  ")
	encoder.Encode(output)
}

func capitalize(s string) string {
	if len(s) == 0 {
		return s
	}
	return string(s[0]-32) + s[1:]
}
