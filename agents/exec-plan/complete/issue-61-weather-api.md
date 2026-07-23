# Execution Plan for Issue #61: Weather API Integration for Dashboard Forecast Strip

## Overview
Implement a real 5-day weather forecast integration for the Dashboard header forecast strip using Open-Meteo API (free, open-access, no API key required). The solution provides a dedicated backend endpoint (`GET /api/v1/weather/forecast`), cache layer, WMO weather code mapping to emoji icons/conditions, and unit toggle (°F / °C) on the frontend with graceful fallbacks.

---

## Proposed Changes

### Backend
1. **New Router & Service (`backend/routers/weather.py`, `backend/services/weather_service.py`)**:
   - Create `GET /api/v1/weather/forecast` accepting optional `lat` (float), `lon` (float), and `units` (`fahrenheit` | `celsius`).
   - Default coordinates: `41.8781, -87.6298` (Chicago) if not provided.
   - Fetch 5-day daily forecast from Open-Meteo (`https://api.open-meteo.com/v1/forecast`).
   - Map WMO weather codes to emoji icons (`☀️`, `⛅`, `☁️`, `🌧️`, `⛈️`, `❄️`, `🌫️`) and condition text.
   - Include in-memory caching (15 min TTL) to avoid excessive external HTTP requests.
   - Handle network errors gracefully by returning fallback empty forecast or default status.
2. **Register Router (`backend/main.py`)**:
   - Include `weather.router` under `/api/v1/weather`.
3. **Backend Testing (`backend/tests/test_weather.py`)**:
   - Unit tests covering WMO mapping, endpoint response shape (Standard Single/List Response envelope), parameter handling, and mock HTTP responses.

### Frontend
1. **API Service (`frontend/src/api/weather.js`)**:
   - Function `fetchWeatherForecast({ lat, lon, units })` calling `/api/v1/weather/forecast`.
2. **Update `WeatherStrip` in `frontend/src/views/DailyLog.jsx`**:
   - Replace `PLACEHOLDER_FORECAST` with dynamic state loaded via `useEffect`.
   - Optionally request browser geolocation (`navigator.geolocation`) to pass `lat`/`lon` to API.
   - Support unit toggle (°F / °C) upon clicking the temperature display, saving preference to `localStorage`.
   - Render condition tooltip on hover and match design theme tokens.
3. **Frontend Testing (`frontend/src/__tests__/WeatherStrip.test.jsx`)**:
   - Component unit tests for loading state, rendered weather items, unit toggling, and fallback rendering on error.

---

## Verification Plan

### Automated Tests
1. Run backend pytest:
   `cd backend && pytest`
2. Run frontend vitest:
   `cd frontend && npm test -- --run`

### Manual Verification
- Load `/` Dashboard in local environment.
- Confirm 5-day weather forecast strip displays current local/Chicago weather with appropriate icons and temperatures.
- Click temperature unit toggle to switch between °F and °C.
- Test offline / network error behavior (confirm fallback to `—°` without crashing page).
