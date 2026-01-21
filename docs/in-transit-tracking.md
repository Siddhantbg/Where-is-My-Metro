# In-Transit Live Tracking Feature

## Overview
The in-transit tracking feature allows metro passengers who are already on a train to track and share live train positions in real-time. This creates a crowdsourced, collaborative tracking system that benefits all users.

## Architecture

### Backend Components

#### 1. Live Tracking Service (`backend/src/services/liveTracking.service.ts`)
- **Position Aggregation**: Combines multiple user reports using weighted averages
- **Confidence Scoring**: Reports weighted by source (onboard > platform > observer) and recency
- **Track Snapping**: Snaps raw GPS coordinates to track geometry for accuracy
- **Speed Validation**: Filters implausible speeds (0-90 km/h)
- **ETA Calculation**: Estimates time to next station based on position and segment speeds
- **Auto-Cleanup**: Removes stale train data after 5 minutes of inactivity

#### 2. Live Tracking Controller (`backend/src/controllers/liveTracking.controller.ts`)
Endpoints:
- `POST /api/live/trains/report` - Submit train position report
- `GET /api/live/trains` - Get all live trains (with filters)
- `GET /api/live/trains/:trainId` - Get specific train with ETA
- `POST /api/live/trains/attach` - Declare "I'm on this train"
- `POST /api/live/trains/detach` - Stop location sharing
- `GET /api/live/trains/:lineId/direction/:direction` - Get trains on a line

### Frontend Components

#### 1. Hooks (`frontend/src/hooks/useLiveTracking.ts`)
- **useTrainTracking**: Polls specific train data every 5 seconds
- **useTrainReporter**: Sends GPS position every 30 seconds (low battery impact)
- **useLineLiveTrains**: Fetches all trains on a line with 10-second refresh
- **useTrainAttachment**: Manages train attachment lifecycle

#### 2. UI Components
- **InTransitMode**: Modal for selecting and tracking trains
- **LiveTrainMap**: Canvas-based visualization of train positions
- **InTransitTracker**: Floating badge and integration component

#### 3. State Management (`frontend/src/store/inTransitSlice.ts`)
Persisted state includes:
- `inTransitMode`: Whether in-transit mode is active
- `inTransitLineId`: Selected line for tracking
- `inTransitDirection`: Forward or backward direction
- `activeTrainId`: Currently tracked train
- `isReportingLocation`: Whether user is sharing location

## User Flow

### 1. Activate In-Transit Mode
- User clicks "In Transit" button in Journey Planner
- System shows all live trains on the selected line

### 2. Select Train
- User browses available trains with confidence scores
- Each train shows: position, speed, confidence, report count
- User clicks to select their train

### 3. Share Location
- System starts sending GPS position every 30 seconds
- Location marked as "onboard" (highest confidence)
- User sees live updates: speed, ETA to next station

### 4. Stop Tracking
- User clicks "Stop Sharing"
- Location sharing stops immediately
- Session persists across refresh until stopped

## Data Flow

```
User GPS → Frontend Hook → POST /api/live/trains/report
                                      ↓
                         Live Tracking Service (aggregate)
                                      ↓
                         In-Memory Store (or Redis)
                                      ↓
              GET /api/live/trains → Frontend UI (5-10s polling)
```

## Confidence Scoring

Trains are assigned confidence scores (0-1) based on:
- **Report Count**: More reports = higher confidence
- **Source Weight**: onboard (3x) > platform (2x) > observer (1x)
- **Recency**: Exponential decay after 1 minute
- **Consistency**: Multiple reports from different sources

## Future Enhancements

### Near-Term
1. **GTFS-RT Integration**: Connect to official metro API feeds when available
2. **WebSocket Updates**: Replace polling with real-time push notifications
3. **Redis Storage**: Replace in-memory store for scalability
4. **Battery Optimization**: Adjust reporting frequency based on train speed

### Long-Term
1. **Shareable Links**: Generate read-only tracking links for friends
2. **Train Predictions**: ML-based arrival time predictions
3. **Crowd Density**: Report and display train crowding levels
4. **Offline Support**: Cache recent data for no-network scenarios

## Technical Considerations

### Accuracy
- GPS accuracy varies (5-50m typical)
- Track snapping improves perceived accuracy
- Multiple reports average out GPS noise

### Privacy
- User location shared only when opted in
- User IDs are temporary/anonymous
- Location not stored after train reaches destination

### Performance
- In-memory store suitable for MVP (100-1000 trains)
- Redis recommended for production (10K+ concurrent users)
- Client polling at 5-10s is acceptable for this use case

### Battery Impact
- 30-second reporting interval is battery-friendly
- Background updates paused when app minimized
- Location sharing stops automatically after 2 hours

## API Examples

### Report Train Location (Onboard)
```typescript
POST /api/live/trains/report
{
  "trainId": "delhi-red-train-01",
  "lineId": "delhi-red",
  "cityId": "delhi",
  "latitude": 28.6139,
  "longitude": 77.2090,
  "direction": "forward",
  "source": "onboard",
  "userId": "user-123",
  "speed": 45.5,
  "accuracy": 10
}
```

### Get Live Trains on a Line
```typescript
GET /api/live/trains/delhi-red/direction/forward
Response: {
  "success": true,
  "trains": [
    {
      "trainId": "delhi-red-train-01",
      "currentLatitude": 28.6139,
      "currentLongitude": 77.2090,
      "speed": 45.5,
      "confidence": 0.85,
      "reportCount": 5,
      "isActive": true
    }
  ]
}
```

## Configuration

### Backend
- `REPORT_RETENTION_MS`: 5 minutes (300,000ms)
- `TRAIN_STALE_MS`: 5 minutes without update
- `MAX_SPEED`: 90 km/h
- `CONFIDENCE_DECAY_MS`: 1 minute

### Frontend
- Train data refresh: 5 seconds
- Line trains refresh: 10 seconds
- Location report interval: 30 seconds
- Auto-stop timeout: 2 hours (future)

## Testing

### Manual Testing
1. Open app in 2+ browser tabs
2. Tab 1: Enable in-transit mode, select train
3. Tab 2: View same line, see reported train appear
4. Move Tab 1 location (dev tools), verify update in Tab 2

### Integration Points
- Ensure backend CORS includes production domain
- Test with real GPS on mobile devices
- Verify localStorage persistence across refresh

## Deployment

### Backend
1. Deploy updated Node.js service to Render
2. Ensure environment variables set (CORS_ORIGIN)
3. Monitor memory usage (in-memory store)

### Frontend
1. Build with `npm run build`
2. Deploy to Vercel
3. Verify API_URL points to production backend

## Support

For issues or questions about the in-transit tracking feature, check:
- Console logs for API errors
- Network tab for failed requests
- Browser geolocation permissions
