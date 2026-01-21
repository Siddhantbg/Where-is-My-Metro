# Go Metro Data Validator - Implementation Plan

## Overview

A standalone Go CLI tool that validates the integrity of metro data in the SQLite database. This tool runs independently and does not modify any existing code.

---

## Directory Structure

```
Where is My Metro/
├── frontend/                    # Existing (untouched)
├── backend/                     # Existing (untouched)
├── docs/                        # Existing
└── go-tools/                    # NEW
    ├── go.mod                   # Go module: github.com/user/metro-tools
    ├── go.sum                   # Dependencies lock file
    ├── cmd/
    │   └── metro-validator/
    │       └── main.go          # CLI entry point
    └── internal/
        ├── database/
        │   └── sqlite.go        # SQLite connection & models
        └── validators/
            ├── city.go          # City validation rules
            ├── station.go       # Station validation rules
            ├── line.go          # Metro line validation rules
            ├── connection.go    # Connection validation rules
            └── interchange.go   # Interchange validation rules
```

---

## Files to Create

### 1. `go-tools/go.mod`

```go
module metro-tools

go 1.21

require (
    github.com/mattn/go-sqlite3 v1.14.22
    github.com/fatih/color v1.16.0      // Colored terminal output
    github.com/spf13/cobra v1.8.0       // CLI framework
)
```

### 2. `go-tools/cmd/metro-validator/main.go`

Entry point with CLI argument parsing:
- `--db` or `-d`: Path to SQLite database (default: `../../backend/data/metro.db`)
- `--verbose` or `-v`: Show detailed output
- `--json`: Output results as JSON
- `--fix`: Suggest fixes (display only, no writes)

### 3. `go-tools/internal/database/sqlite.go`

Database models matching the Drizzle schema:

```go
type City struct {
    ID          string
    Name        string
    DisplayName string
    Country     string
    Timezone    string
    MapCenter   string  // JSON string: {"lat": 28.6, "lng": 77.2}
    IsActive    bool
}

type MetroLine struct {
    ID           string
    CityID       string
    Name         string
    Color        string  // Hex color: #E21B28
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
    Direction      string  // "forward" or "backward"
}

type StationConnection struct {
    ID                int
    FromStationID     string
    ToStationID       string
    LineID            string
    TravelTimeSeconds int
    StopTimeSeconds   int
}
```

### 4. `go-tools/internal/validators/city.go`

**City Validations:**
- [ ] `MapCenter` is valid JSON with `lat` and `lng` fields
- [ ] `lat` is between -90 and 90
- [ ] `lng` is between -180 and 180
- [ ] `Timezone` is a valid IANA timezone
- [ ] No duplicate city IDs

### 5. `go-tools/internal/validators/station.go`

**Station Validations:**
- [ ] Coordinates are within reasonable bounds for India (lat: 8-37, lng: 68-97)
- [ ] Coordinates are within ~50km of city's MapCenter
- [ ] Station name is not empty
- [ ] No duplicate station IDs
- [ ] `CityID` references an existing city

### 6. `go-tools/internal/validators/line.go`

**Line Validations:**
- [ ] `Color` is a valid hex code (matches `^#[0-9A-Fa-f]{6}$`)
- [ ] `CityID` references an existing city
- [ ] `DisplayOrder` is positive
- [ ] No duplicate line IDs
- [ ] Line has at least 2 stations

### 7. `go-tools/internal/validators/connection.go`

**Connection Validations:**
- [ ] `TravelTimeSeconds` is between 30 and 600 (30s to 10min)
- [ ] `StopTimeSeconds` is between 10 and 120
- [ ] `FromStationID` and `ToStationID` both exist
- [ ] `LineID` references an existing line
- [ ] Both stations belong to the same line
- [ ] No self-connections (from == to)
- [ ] Bidirectional connections exist (A→B and B→A)

### 8. `go-tools/internal/validators/interchange.go`

**Interchange Validations:**
- [ ] Stations marked `IsInterchange=true` appear on 2+ lines
- [ ] Stations on 2+ lines should be marked as interchange
- [ ] Interchange stations have connections to all their lines

---

## Validation Rules Summary

| Category | Rule | Severity |
|----------|------|----------|
| City | Valid MapCenter JSON | ERROR |
| City | Coordinates in valid range | ERROR |
| City | Valid timezone | WARNING |
| Station | Within city bounds (~50km) | ERROR |
| Station | Within India bounds | WARNING |
| Station | Has valid CityID | ERROR |
| Line | Valid hex color | ERROR |
| Line | Has 2+ stations | ERROR |
| Line | Positive display order | WARNING |
| Connection | Travel time 30-600s | WARNING |
| Connection | Stop time 10-120s | WARNING |
| Connection | Both stations exist | ERROR |
| Connection | Bidirectional exists | WARNING |
| Interchange | Multi-line = IsInterchange | WARNING |
| Interchange | IsInterchange = multi-line | ERROR |

---

## CLI Output Example

```
$ metro-validator --db ../backend/data/metro.db

🔍 Metro Data Validator v1.0.0
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Database: ../backend/data/metro.db
   Cities: 2 | Lines: 10 | Stations: 285 | Connections: 568

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ City Validations                    [2/2 passed]
✓ Line Validations                    [10/10 passed]
✓ Station Validations                 [285/285 passed]
⚠ Connection Validations              [566/568 passed]
  └─ WARNING: Connection delhi-conn-42 has travel time 720s (> 600s recommended)
  └─ WARNING: Missing reverse connection for bangalore-conn-15
✓ Interchange Validations             [12/12 passed]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Summary: 0 errors, 2 warnings
Status: PASS (with warnings)
```

---

## JSON Output Example

```json
{
  "database": "../backend/data/metro.db",
  "timestamp": "2026-01-21T10:30:00Z",
  "stats": {
    "cities": 2,
    "lines": 10,
    "stations": 285,
    "connections": 568
  },
  "results": {
    "city": { "passed": 2, "failed": 0, "warnings": 0 },
    "line": { "passed": 10, "failed": 0, "warnings": 0 },
    "station": { "passed": 285, "failed": 0, "warnings": 0 },
    "connection": { "passed": 566, "failed": 0, "warnings": 2 },
    "interchange": { "passed": 12, "failed": 0, "warnings": 0 }
  },
  "issues": [
    {
      "severity": "warning",
      "category": "connection",
      "id": "delhi-conn-42",
      "message": "Travel time 720s exceeds recommended maximum of 600s"
    }
  ],
  "status": "pass_with_warnings"
}
```

---

## Usage

### Build

```bash
cd go-tools
go mod tidy
go build -o metro-validator ./cmd/metro-validator
```

### Run

```bash
# Basic usage (auto-detects database)
./metro-validator

# Specify database path
./metro-validator --db ../backend/data/metro.db

# Verbose output
./metro-validator -v

# JSON output (for CI/CD integration)
./metro-validator --json

# Show suggested fixes
./metro-validator --fix
```

---

## Integration Points

This tool is **completely standalone**. However, it can be integrated:

1. **Pre-commit hook**: Validate data before committing seed changes
2. **CI/CD pipeline**: Run as part of PR checks
3. **npm script**: Add to backend `package.json`:
   ```json
   "scripts": {
     "validate:data": "cd ../go-tools && go run ./cmd/metro-validator --db ./data/metro.db"
   }
   ```

---

## Dependencies

| Package | Purpose |
|---------|---------|
| `github.com/mattn/go-sqlite3` | SQLite driver (CGO) |
| `github.com/fatih/color` | Colored terminal output |
| `github.com/spf13/cobra` | CLI argument parsing |

---

## Implementation Order

1. **Phase 1**: Project setup (`go.mod`, directory structure)
2. **Phase 2**: Database layer (`sqlite.go` with models and queries)
3. **Phase 3**: Core validators (city, line, station)
4. **Phase 4**: Connection & interchange validators
5. **Phase 5**: CLI interface with colored output
6. **Phase 6**: JSON output mode

---

## Implementation Status: COMPLETE

All components have been implemented and tested.

### Files Created

```
go-tools/
├── go.mod                              # Go module definition
├── go.sum                              # Dependencies lock
├── metro-validator.exe                 # Built binary
├── cmd/metro-validator/
│   ├── main.go                         # CLI entry point
│   └── server.go                       # HTTP server mode
└── internal/
    ├── database/
    │   └── sqlite.go                   # DB models & queries
    └── validators/
        ├── types.go                    # Shared types
        ├── city.go                     # City validation
        ├── station.go                  # Station validation
        ├── line.go                     # Line validation
        ├── connection.go               # Connection validation
        └── interchange.go              # Interchange validation

frontend/src/
├── hooks/
│   └── useDataValidator.ts             # Hook for Go validator API
└── components/admin/
    ├── index.ts                        # Exports
    └── DataValidator.tsx               # Validation UI component

package.json                            # Root package.json with Go scripts
```

### Verified Working

- CLI validation: `./metro-validator.exe --db ../backend/data/metro.db`
- JSON output: `./metro-validator.exe --json`
- HTTP server: `./metro-validator.exe serve`
- Health endpoint: `GET http://localhost:5001/health`
- Validate endpoint: `GET http://localhost:5001/api/validate`
