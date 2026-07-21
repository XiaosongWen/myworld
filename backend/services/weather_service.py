from datetime import datetime, date
import time
from typing import List, Tuple
import httpx

from schemas.weather import WeatherForecastItem

# WMO Weather interpretation codes (WMO 4501)
WMO_CODE_MAP: dict[int, Tuple[str, str]] = {
    0: ("☀️", "Clear Sky"),
    1: ("⛅", "Mainly Clear"),
    2: ("⛅", "Partly Cloudy"),
    3: ("☁️", "Overcast"),
    45: ("🌫️", "Foggy"),
    48: ("🌫️", "Depositing Rime Fog"),
    51: ("🌧️", "Light Drizzle"),
    53: ("🌧️", "Moderate Drizzle"),
    55: ("🌧️", "Dense Drizzle"),
    56: ("🌧️", "Freezing Drizzle"),
    57: ("🌧️", "Dense Freezing Drizzle"),
    61: ("🌧️", "Slight Rain"),
    63: ("🌧️", "Moderate Rain"),
    65: ("🌧️", "Heavy Rain"),
    66: ("🌧️", "Freezing Rain"),
    67: ("🌧️", "Heavy Freezing Rain"),
    71: ("❄️", "Slight Snow"),
    73: ("❄️", "Moderate Snow"),
    75: ("❄️", "Heavy Snow"),
    77: ("❄️", "Snow Grains"),
    80: ("🌧️", "Slight Rain Showers"),
    81: ("🌧️", "Moderate Rain Showers"),
    82: ("🌧️", "Violent Rain Showers"),
    85: ("❄️", "Slight Snow Showers"),
    86: ("❄️", "Heavy Snow Showers"),
    95: ("⛈️", "Thunderstorm"),
    96: ("⛈️", "Thunderstorm with Slight Hail"),
    99: ("⛈️", "Thunderstorm with Heavy Hail"),
}

CACHE_TTL_SECONDS = 900  # 15 minutes
_weather_cache: dict[Tuple[float, float], Tuple[float, List[WeatherForecastItem]]] = {}


def get_wmo_info(code: int) -> Tuple[str, str]:
    return WMO_CODE_MAP.get(code, ("⛅", "Partly Cloudy"))


def get_day_label(date_str: str, index: int) -> str:
    if index == 0:
        return "Today"
    try:
        dt = datetime.strptime(date_str, "%Y-%m-%d")
        return dt.strftime("%a")
    except ValueError:
        return date_str


class WeatherService:
    @staticmethod
    async def get_forecast(lat: float = 41.8781, lon: float = -87.6298) -> List[WeatherForecastItem]:
        cache_key = (round(lat, 2), round(lon, 2))
        now = time.time()

        if cache_key in _weather_cache:
            cached_time, cached_data = _weather_cache[cache_key]
            if now - cached_time < CACHE_TTL_SECONDS:
                return cached_data

        url = "https://api.open-meteo.com/v1/forecast"
        params = {
            "latitude": lat,
            "longitude": lon,
            "daily": "weather_code,temperature_2m_max,temperature_2m_min",
            "forecast_days": 5,
            "timezone": "auto",
        }

        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                res = await client.get(url, params=params)
                res.raise_for_status()
                data = res.json()

            daily = data.get("daily", {})
            time_list = daily.get("time", [])
            wmo_codes = daily.get("weather_code", [])
            max_temps = daily.get("temperature_2m_max", [])
            min_temps = daily.get("temperature_2m_min", [])

            items: List[WeatherForecastItem] = []
            for i in range(min(5, len(time_list))):
                date_str = time_list[i]
                wmo_code = wmo_codes[i] if i < len(wmo_codes) else 0
                icon, condition = get_wmo_info(wmo_code)

                max_c = max_temps[i] if i < len(max_temps) else 20
                min_c = min_temps[i] if i < len(min_temps) else 10
                avg_c = round((max_c + min_c) / 2)
                avg_f = round(avg_c * 9 / 5 + 32)

                label = get_day_label(date_str, i)
                items.append(
                    WeatherForecastItem(
                        label=label,
                        date=date_str,
                        icon=icon,
                        temp_f=avg_f,
                        temp_c=avg_c,
                        condition=condition,
                    )
                )

            if items:
                _weather_cache[cache_key] = (now, items)
                return items
        except Exception as e:
            # If cache has expired data, return it as fallback
            if cache_key in _weather_cache:
                return _weather_cache[cache_key][1]

        # Ultimate fallback when fetch fails and no cache exists
        today_iso = date.today().isoformat()
        return [
            WeatherForecastItem(label="Today", date=today_iso, icon="⛅", temp_f=70, temp_c=21, condition="Unavailable"),
            WeatherForecastItem(label="Day 2", date=today_iso, icon="⛅", temp_f=70, temp_c=21, condition="Unavailable"),
            WeatherForecastItem(label="Day 3", date=today_iso, icon="⛅", temp_f=70, temp_c=21, condition="Unavailable"),
            WeatherForecastItem(label="Day 4", date=today_iso, icon="⛅", temp_f=70, temp_c=21, condition="Unavailable"),
            WeatherForecastItem(label="Day 5", date=today_iso, icon="⛅", temp_f=70, temp_c=21, condition="Unavailable"),
        ]
