# Execution Plan: Custom Location Search (City Name / Zipcode)

## Goal
Allow users to manually change their location by searching for a city name or zipcode (e.g. "Austin", "Seattle", "78701", "90210") with auto-suggestions, saving the custom location to `localStorage`, and providing a reset button to return to auto-detected location.

---

## Proposed Technical Approach

### 1. Backend Service & Endpoint (`GET /api/v1/weather/locations/search`)
- **Open-Meteo Geocoding API**: Create `GET /api/v1/weather/locations/search?q={query}` in `backend/routers/weather.py`.
- Call Open-Meteo Geocoding API (`https://geocoding-api.open-meteo.com/v1/search?name={query}&count=5`).
- For 5-digit US zipcodes (e.g. `78701`), support fallback to `http://api.zippopotam.us/us/{zipcode}` if Geocoding API yields no results.
- Returns list of matching results:
  ```json
  [
    {
      "city": "Austin",
      "region": "Texas",
      "country": "United States",
      "lat": 30.2672,
      "lon": -97.7431
    }
  ]
  ```

### 2. Frontend Location Search Modal / Popover (`frontend/src/views/DailyLog.jsx`)
- **Clickable Location Name**: Clicking the location name in the header or location button in `WeatherStrip` opens a compact Location Picker popover.
- **Search Input & Suggestions**: As user types a city name or zipcode, debounce search request (`fetchLocationSearch(query)`).
- **Selection & Persistence**: Selecting a city updates `WeatherStrip` to load forecast for chosen `lat`/`lon`, and stores custom location in `localStorage` (`custom_weather_location`).
- **Reset to Auto-Detect**: Include a "📍 Use Current Location" button to clear custom location and return to automatic GPS / IP detection.

### 3. Verification & Testing
- Pytest unit tests for `GET /api/v1/weather/locations/search` in `backend/tests/test_weather.py`.
- Vitest unit tests for custom location selection and persistence in `frontend/src/__tests__/WeatherStrip.test.jsx`.

---

## Verification Steps
1. Run backend tests: `cd backend && pytest`
2. Run frontend tests: `cd frontend && npm test -- --run`
3. Manual test: Click city header -> search "78701" or "Tokyo" -> select result -> verify weather & header update immediately.
