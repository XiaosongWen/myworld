from datetime import datetime, date
import re
import time
from typing import List, Optional, Tuple
import httpx

from schemas.weather import LocationInfo, LocationSearchResult, WeatherForecastItem, WeatherForecastResult

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
_weather_cache: dict[Tuple[float, float], Tuple[float, WeatherForecastResult]] = {}
_ip_location_cache: Tuple[float, LocationInfo] | None = None


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
    async def resolve_location(
        client_ip: Optional[str] = None,
        lat: Optional[float] = None,
        lon: Optional[float] = None,
    ) -> LocationInfo:
        global _ip_location_cache
        now = time.time()

        # Case 1: Browser or user provided lat & lon -> reverse geocode
        if lat is not None and lon is not None:
            try:
                url = f"https://api.bigdatacloud.net/data/reverse-geocode-client?latitude={lat}&longitude={lon}&localityLanguage=en"
                async with httpx.AsyncClient(timeout=4.0) as client:
                    res = await client.get(url)
                    if res.status_code == 200:
                        data = res.json()
                        city = data.get("city") or data.get("locality") or data.get("localityInfo", {}).get("administrative", [{}])[0].get("name") or "Unknown City"
                        region = data.get("principalSubdivision") or data.get("countryName") or ""
                        return LocationInfo(city=city, region=region, lat=lat, lon=lon)
            except Exception:
                pass
            return LocationInfo(city="Local Area", region="", lat=lat, lon=lon)

        # Case 2: IP-based resolution (or public egress IP if client_ip is local)
        if _ip_location_cache and (now - _ip_location_cache[0] < CACHE_TTL_SECONDS):
            return _ip_location_cache[1]

        try:
            target_url = "http://ip-api.com/json/"
            if client_ip and client_ip not in ("127.0.0.1", "::1", "localhost") and not client_ip.startswith("192.168."):
                target_url = f"http://ip-api.com/json/{client_ip}"

            async with httpx.AsyncClient(timeout=4.0) as client:
                res = await client.get(target_url)
                if res.status_code == 200:
                    data = res.json()
                    if data.get("status") == "success":
                        loc = LocationInfo(
                            city=data.get("city", "Unknown City"),
                            region=data.get("regionName", data.get("country", "")),
                            lat=float(data.get("lat", 41.8781)),
                            lon=float(data.get("lon", -87.6298)),
                        )
                        _ip_location_cache = (now, loc)
                        return loc
        except Exception:
            pass

        # Ultimate fallback
        fallback = LocationInfo(city="Unknown City", region="", lat=41.8781, lon=-87.6298)
        _ip_location_cache = (now, fallback)
        return fallback

    @staticmethod
    async def search_locations(query: str) -> List[LocationSearchResult]:
        q = query.strip()
        if not q:
            return []

        results: List[LocationSearchResult] = []

        # Check if 5-digit US zipcode
        if re.match(r"^\d{5}$", q):
            try:
                zip_url = f"http://api.zippopotam.us/us/{q}"
                async with httpx.AsyncClient(timeout=4.0) as client:
                    res = await client.get(zip_url)
                    if res.status_code == 200:
                        data = res.json()
                        places = data.get("places", [])
                        if places:
                            place = places[0]
                            city = place.get("place name", q)
                            region = place.get("state", "US")
                            lat = float(place.get("latitude"))
                            lon = float(place.get("longitude"))
                            results.append(
                                LocationSearchResult(
                                    city=city,
                                    region=region,
                                    country="United States",
                                    lat=lat,
                                    lon=lon,
                                )
                            )
            except Exception:
                pass

        # Also search Open-Meteo Geocoding API
        try:
            geo_url = "https://geocoding-api.open-meteo.com/v1/search"
            params = {"name": q, "count": 5, "language": "en", "format": "json"}
            async with httpx.AsyncClient(timeout=4.0) as client:
                res = await client.get(geo_url, params=params)
                if res.status_code == 200:
                    data = res.json()
                    geo_results = data.get("results", [])
                    for item in geo_results:
                        city = item.get("name", "Unknown")
                        region = item.get("admin1", "")
                        country = item.get("country", "")
                        lat = float(item.get("latitude"))
                        lon = float(item.get("longitude"))

                        # Avoid exact duplicates if zip matched
                        if not any(abs(r.lat - lat) < 0.01 and abs(r.lon - lon) < 0.01 for r in results):
                            results.append(
                                LocationSearchResult(
                                    city=city,
                                    region=region,
                                    country=country,
                                    lat=lat,
                                    lon=lon,
                                )
                            )
        except Exception:
            pass

        return results

    @staticmethod
    async def get_forecast(
        client_ip: Optional[str] = None,
        lat: Optional[float] = None,
        lon: Optional[float] = None,
    ) -> WeatherForecastResult:
        location = await WeatherService.resolve_location(client_ip=client_ip, lat=lat, lon=lon)

        cache_key = (round(location.lat, 2), round(location.lon, 2))
        now = time.time()

        if cache_key in _weather_cache:
            cached_time, cached_result = _weather_cache[cache_key]
            if now - cached_time < CACHE_TTL_SECONDS:
                cached_result.location = location
                return cached_result

        url = "https://api.open-meteo.com/v1/forecast"
        params = {
            "latitude": location.lat,
            "longitude": location.lon,
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

            result = WeatherForecastResult(location=location, forecast=items)
            if items:
                _weather_cache[cache_key] = (now, result)
                return result
        except Exception:
            if cache_key in _weather_cache:
                return _weather_cache[cache_key][1]

        today_iso = date.today().isoformat()
        fallback_items = [
            WeatherForecastItem(label="Today", date=today_iso, icon="⛅", temp_f=70, temp_c=21, condition="Unavailable"),
            WeatherForecastItem(label="Day 2", date=today_iso, icon="⛅", temp_f=70, temp_c=21, condition="Unavailable"),
            WeatherForecastItem(label="Day 3", date=today_iso, icon="⛅", temp_f=70, temp_c=21, condition="Unavailable"),
            WeatherForecastItem(label="Day 4", date=today_iso, icon="⛅", temp_f=70, temp_c=21, condition="Unavailable"),
            WeatherForecastItem(label="Day 5", date=today_iso, icon="⛅", temp_f=70, temp_c=21, condition="Unavailable"),
        ]
        return WeatherForecastResult(location=location, forecast=fallback_items)
