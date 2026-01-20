# Where is My Metro 🚇

A lightweight Progressive Web App (PWA) for tracking Delhi Metro trains in real-time using schedule-based simulation.

## Project Overview

This app provides a clean, minimal interface showing your metro journey with a visual indicator of where the train currently is between stations. Built with modern web technologies, it works offline and can be installed on mobile devices.

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** - Fast build tool
- **Tailwind CSS** - Utility-first styling
- **Zustand** - Lightweight state management (~1KB)
- **Leaflet.js** - OpenStreetMap integration
- **Axios** - HTTP client

### Backend
- **Node.js** with Express
- **TypeScript** - Type safety
- **Drizzle ORM** - SQL query builder
- **SQLite** - Lightweight database (MVP)
- **better-sqlite3** - Fast SQLite driver

## Project Structure

```
Where is My Metro/
├── frontend/           # React PWA
│   ├── src/
│   │   ├── components/ # UI components
│   │   ├── hooks/      # Custom React hooks
│   │   ├── services/   # API services
│   │   ├── store/      # Zustand store
│   │   ├── types/      # TypeScript types
│   │   └── utils/      # Utility functions
│   └── ...
├── backend/            # Express API
│   ├── src/
│   │   ├── config/     # Configuration
│   │   ├── controllers/# Route controllers
│   │   ├── db/         # Database schema & seeds
│   │   ├── routes/     # API routes
│   │   └── services/   # Business logic
│   └── data/
│       └── metro.db    # SQLite database
└── README.md
```

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Push database schema:
```bash
npm run db:push
```

4. Seed the database:
```bash
npm run db:seed
```

5. Start development server:
```bash
npm run dev
```

Backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

Frontend will run on `http://localhost:5173`

## API Endpoints

### Health Check
- `GET /api/health` - Check API status

### Metro Lines
- `GET /api/lines` - Get all metro lines
- `GET /api/lines/:id` - Get specific line by ID

### Stations
- `GET /api/stations` - Get all stations (optional `?lineId=` filter)
- `GET /api/stations/:id` - Get specific station
- `GET /api/stations/nearby?lat={lat}&lng={lng}&radius={meters}` - Get nearby stations

### Routes
- `POST /api/routes/find` - Find route between two stations
  ```json
  {
    "origin": "station-id",
    "destination": "station-id",
    "departureTime": "2024-01-15T08:30:00Z" // optional
  }
  ```

## Current Status - Week 1 Complete ✅

### Completed Tasks
- ✅ Frontend project initialized with Vite + React + TypeScript
- ✅ Tailwind CSS configured
- ✅ Backend project setup with Express + TypeScript
- ✅ Drizzle ORM configured with SQLite
- ✅ Database schema created for metro data
- ✅ Zustand store structure implemented
- ✅ Basic Express server with API routes
- ✅ Database seeded with sample Delhi Metro data
- ✅ API endpoints tested and working
- ✅ Frontend-backend integration verified

### Sample Data Included
- **8 Metro Lines**: Red, Blue, Yellow, Green, Violet, Pink, Magenta, Grey
- **10 Test Stations**: Including Rajiv Chowk, Kashmere Gate, Hauz Khas, etc.
- **Yellow Line Route**: HUDA City Centre → Kashmere Gate (6 stations)
- **Connection Times**: Inter-station travel times configured
- **Schedule Data**: Peak/off-peak frequencies set

## Next Steps - Week 2

### Core Features to Implement
- [ ] Geolocation API integration
- [ ] Location permission UI
- [ ] Nearby stations calculation (Haversine formula)
- [ ] Leaflet map with station markers
- [ ] Station search with autocomplete
- [ ] Dijkstra's algorithm for route finding
- [ ] Journey planner UI

## Development Scripts

### Backend
```bash
npm run dev        # Start development server with hot reload
npm run build      # Build for production
npm run start      # Start production server
npm run db:push    # Push schema changes to database
npm run db:seed    # Seed database with data
npm run db:studio  # Open Drizzle Studio (database GUI)
```

### Frontend
```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
```

## Environment Variables

### Backend (.env)
```env
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
```

## Database Schema

### Tables
- `metro_lines` - Metro line information (color, name)
- `metro_stations` - Station data (coordinates, interchange status)
- `line_stations` - Line-station relationships (sequence, direction)
- `station_connections` - Inter-station travel times
- `train_schedules` - Train frequency and timings
- `peak_hours` - Peak hour definitions

## Features (Planned)

### MVP (Phase 1)
- Location-based nearby station detection
- Color-coded metro lines display
- Journey planning with route calculation
- Live tracking with animated train indicator
- Schedule-based position simulation
- Offline PWA functionality

### Enhancements (Phase 2)
- Multiple route options
- Save favorite journeys
- Station facilities information
- Share journey links

### Advanced (Phase 3)
- Real-time DMRC API integration
- Redis caching
- User accounts & authentication
- Push notifications
- Fare calculator

## Contributing

This is a learning/portfolio project. Feel free to fork and experiment!

## License

MIT

---

**Current Version**: 0.1.0 (Week 1 Complete)
**Last Updated**: January 2026
