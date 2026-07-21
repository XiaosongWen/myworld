# Execution Plan: Precise Location & City Geolocation for Dashboard

## Problem Statement
The current Dashboard displays a coarse IANA region representative city ("Chicago") by extracting the timezone name from `Intl.DateTimeFormat()`, which incorrectly displays "Chicago" for anyone anywhere in the US Central Timezone (e.g., Houston, Austin, Dallas, Minneapolis). Furthermore, the Weather service falls back to hardcoded Chicago coordinates (`41.8781, -87.6298`) if browser geolocation is absent or denied.

## Goal
Implement precise location detection that resolves the user's actual city, state/region, latitude, and longitude using browser GPS / IP-based geolocation and reverse geocoding, eliminating hardcoded Chicago fallbacks and replacing the timezone string with the user's real city name.

---

## Technical Approach

### 1. Backend Service (`backend/services/weather_service.py` & `backend/routers/weather.py`)
- **IP Geolocation**: If `lat` and `lon` are missing, fetch real IP geolocation via `http://ip-api.com/json/` or `https://ipapi.co/json/` to dynamically resolve the user's actual city, region, `lat`, and `lon`.
- **Reverse Geocoding**: If `lat` and `lon` are provided (e.g., from browser GPS), call reverse geocoding API to resolve exact city and state names.
- **API Schema Update**: Update `GET /api/v1/weather/forecast` to return a `location` object:
  ```json
  {
    "msg": "success",
    "request_id": "...",
    "location": {
      "city": "Austin",
      "region": "Texas",
      "lat": 30.2672,
      "lon": -97.7431
    },
    "data": [ ... 5-day forecast ... ]
  }
  ```

### 2. Frontend Integration (`frontend/src/views/DailyLog.jsx` & `frontend/src/api/weather.js`)
- Update `fetchWeatherForecast()` in `frontend/src/api/weather.js` to return both `location` and `data`.
- In `DailyLog.jsx`, replace the coarse `Intl.DateTimeFormat()` timezone string in the header with `location.city` and `location.region` (e.g., `"Austin, Texas"` or `"Seattle, WA"`).
- Remove all hardcoded default fallback references to Chicago.

### 3. Automated & Unit Testing
- Update `backend/tests/test_weather.py` to test IP resolution, reverse geocoding, and response schema.
- Update `frontend/src/__tests__/WeatherStrip.test.jsx` to test dynamic city header rendering.

---

## Verification Steps
1. Run backend tests: `cd backend && pytest`
2. Run frontend tests: `cd frontend && npm test -- --run`
3. Verify Dashboard header shows exact local city/state instead of IANA region string ("Chicago").
