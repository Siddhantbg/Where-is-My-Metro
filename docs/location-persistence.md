# Location Persistence & Route Reset Feature

## Overview
This feature ensures that:
1. Location is persisted across page reloads
2. Location permission dialog doesn't reappear after initial selection
3. Users can change location via a button in the navbar
4. When location changes, any existing route is cleared
5. A warning message appears when location is changed

## Changes Made

### Frontend

#### 1. **App.tsx** - Main Application Component
- **Added imports**: `MapPin`, `AlertCircle` from lucide-react
- **Added state**: `showLocationChangeWarning` to control warning message display
- **Updated useStore destructure**: Added `clearJourney` method
- **Modified LocationPermission logic**: Only shows if `!selectedCity && !showManualSelect` (previously checked `!userLocation`)
- **Enhanced handleCitySelect**: 
  - Detects if city is already selected
  - If changing city, clears journey and shows warning
  - Displays route reset message for 4 seconds
- **Added handleChangeLocation**: 
  - Opens city selection modal
  - Shows location change warning
- **Enhanced Header**:
  - Displays current city with icon
  - "Change" button appears next to city name when city is selected
- **Added Location Change Warning Banner**:
  - Orange alert banner slides down from top
  - Shows "Location changed" message
  - Auto-dismisses after 4 seconds

#### 2. **index.css** - Styling
- **Added `slide-down` animation**:
  - Smooth animation from top with fade-in
  - Used for location change warning banner
- **Added `animate-slide-down` class**: Applies the animation

#### 3. **Store Persistence** (Already Configured)
- `selectedCity` is persisted in localStorage
- Journey data (`origin`, `destination`, `currentJourney`) is persisted
- On page reload, store restores from localStorage

## User Flow

### Initial Visit
1. App loads
2. Location permission dialog appears
3. User clicks "Use My Location" or "Select Manually"
4. User selects city
5. Success animation plays
6. Journey planner becomes available

### On Page Reload
1. App loads
2. Store hydrates from localStorage
3. **No location permission dialog** (since city already selected)
4. City is displayed in navbar with "Change" button
5. Journey planner is available
6. Previous journey is still there (persisted)

### Changing Location
1. User clicks "Change" button in navbar
2. Location change warning appears (orange banner)
3. City selection modal opens
4. User selects new city
5. **Current route is automatically cleared**
6. Success animation plays
7. Journey planner is reset for new city

## Technical Details

### State Persistence
```typescript
partialize: (state) => ({
  locationPermission: state.locationPermission,
  selectedCity: state.selectedCity,  // Key: persists across reload
  origin: state.origin,
  destination: state.destination,
  currentJourney: state.currentJourney,
  // ... other persisted state
})
```

### Location Permission Logic
**Before**: Only checked `userLocation` (browser geolocation)
```typescript
{!userLocation && !showManualSelect && (
  <LocationPermission onManualSelect={handleManualSelect} />
)}
```

**After**: Checks `selectedCity` instead
```typescript
{!selectedCity && !showManualSelect && (
  <LocationPermission onManualSelect={handleManualSelect} />
)}
```

### Route Clearing on City Change
```typescript
if (selectedCity && selectedCity !== cityId) {
  clearJourney();  // Clears origin, destination, currentJourney
  setShowLocationChangeWarning(true);
}
```

## Benefits

1. **Better UX**: Users don't need to grant location permission every reload
2. **Cleaner Navigation**: Location displayed in header with easy change option
3. **Data Integrity**: Route is automatically cleared when city changes (prevents confusion)
4. **Clear Feedback**: Warning message informs user route was reset
5. **Session Persistence**: User's location and route context maintained across reloads

## Testing Checklist

- [ ] Load app, select location, reload → location persists, no permission dialog
- [ ] Verify "Change" button appears in navbar after city selection
- [ ] Click "Change", select different city → orange warning appears
- [ ] Verify current route is cleared after city change
- [ ] Set route, reload → route persists
- [ ] Change location while having route set → warning shows, route clears
- [ ] Mobile: Test on actual device with geolocation
