# Execution Plan: Location-Aware Timezone Flip Clock & Date

## Goal
Update the Dashboard flip clock and long date display to automatically reflect the local time and date of the active location (e.g., Tokyo local time when Tokyo is selected, London local time when London is selected), rather than always displaying the user's local browser machine time.

---

## Proposed Technical Approach

### 1. Backend Timezone Resolution (`backend/schemas/weather.py`, `backend/services/weather_service.py`)
- Include `timezone: Optional[str]` field in `LocationInfo` and `LocationSearchResult`.
- When fetching weather forecast from Open-Meteo or IP-api / BigDataCloud, extract the location's official IANA timezone string (e.g., `"Asia/Tokyo"`, `"Europe/London"`, `"America/New_York"`).
- Return `timezone` in `LocationInfo` object to frontend.

### 2. Frontend Zoned Clock (`frontend/src/views/DailyLog.jsx`)
- Pass active `locationTimezone` (e.g., `"Asia/Tokyo"`) into the live clock logic.
- Use `Intl.DateTimeFormat` with `timeZone` parameter to extract target location's `hours`, `minutes`, `seconds`, and formatted long date string (`dateLong`).
- The flip clock panels (`HH:MM:SS`) and date string update in real time to match the active location's time zone.

### 3. Verification & Testing
- Pytest tests for timezone inclusion in `backend/tests/test_weather.py`.
- Vitest tests for zoned clock formatting in `frontend/src/__tests__/WeatherStrip.test.jsx`.

---

## Verification Steps
1. Run backend tests: `cd backend && pytest`
2. Run frontend tests: `cd frontend && npm test -- --run`
3. Manual test: Change location to "Tokyo" -> verify flip clock and date switch to Tokyo local time. Reset location -> verify flip clock returns to local auto-location time.
