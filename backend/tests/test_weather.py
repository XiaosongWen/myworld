from unittest.mock import AsyncMock, patch
import pytest
from httpx import ASGITransport, AsyncClient
from main import app
from schemas.weather import LocationInfo, LocationSearchResult, WeatherForecastItem, WeatherForecastResult
from services.weather_service import WMO_CODE_MAP, get_wmo_info, get_day_label, WeatherService


@pytest.mark.asyncio
async def test_weather_forecast_endpoint():
    mock_result = WeatherForecastResult(
        location=LocationInfo(city="Chicago", region="Illinois", lat=41.8781, lon=-87.6298, timezone="America/Chicago"),
        forecast=[
            WeatherForecastItem(label="Today", date="2026-07-22", icon="☀️", temp_f=75, temp_c=24, high_f=80, high_c=27, low_f=70, low_c=21, condition="Clear Sky"),
            WeatherForecastItem(label="Thu", date="2026-07-23", icon="⛅", temp_f=72, temp_c=22, high_f=76, high_c=24, low_f=68, low_c=20, condition="Partly Cloudy"),
            WeatherForecastItem(label="Fri", date="2026-07-24", icon="🌧️", temp_f=68, temp_c=20, high_f=72, high_c=22, low_f=64, low_c=18, condition="Moderate Rain"),
            WeatherForecastItem(label="Sat", date="2026-07-25", icon="⛅", temp_f=70, temp_c=21, high_f=74, high_c=23, low_f=66, low_c=19, condition="Partly Cloudy"),
            WeatherForecastItem(label="Sun", date="2026-07-26", icon="☀️", temp_f=78, temp_c=25, high_f=82, high_c=28, low_f=72, low_c=22, condition="Clear Sky"),
        ]
    )

    with patch.object(WeatherService, "get_forecast", new=AsyncMock(return_value=mock_result)):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            response = await ac.get("/api/v1/weather/forecast")
            assert response.status_code == 200
            json_data = response.json()
            assert json_data["msg"] == "success"
            assert "request_id" in json_data
            assert "location" in json_data["data"]
            assert "forecast" in json_data["data"]

            location = json_data["data"]["location"]
            assert location["city"] == "Chicago"
            assert location["region"] == "Illinois"

            forecast = json_data["data"]["forecast"]
            assert len(forecast) == 5

            first_item = forecast[0]
            assert first_item["label"] == "Today"
            assert first_item["icon"] == "☀️"
            assert first_item["temp_f"] == 75
            assert first_item["temp_c"] == 24
            assert first_item["condition"] == "Clear Sky"


@pytest.mark.asyncio
async def test_weather_forecast_endpoint_with_lat_lon():
    mock_result = WeatherForecastResult(
        location=LocationInfo(city="Austin", region="Texas", lat=30.2672, lon=-97.7431, timezone="America/Chicago"),
        forecast=[WeatherForecastItem(label="Today", date="2026-07-22", icon="☀️", temp_f=90, temp_c=32, high_f=95, high_c=35, low_f=82, low_c=28, condition="Clear Sky")] * 5
    )

    with patch.object(WeatherService, "get_forecast", new=AsyncMock(return_value=mock_result)):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            response = await ac.get("/api/v1/weather/forecast?lat=30.2672&lon=-97.7431")
            assert response.status_code == 200
            json_data = response.json()
            location = json_data["data"]["location"]
            assert location["lat"] == 30.2672
            assert location["lon"] == -97.7431


@pytest.mark.asyncio
async def test_search_weather_locations():
    mock_search = [
        LocationSearchResult(city="Seattle", region="Washington", country="United States", lat=47.6062, lon=-122.3321, timezone="America/Los_Angeles")
    ]

    with patch.object(WeatherService, "search_locations", new=AsyncMock(return_value=mock_search)):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            response = await ac.get("/api/v1/weather/locations/search?q=Seattle")
            assert response.status_code == 200
            json_data = response.json()
            assert json_data["msg"] == "success"
            assert isinstance(json_data["data"], list)
            assert len(json_data["data"]) == 1
            item = json_data["data"][0]
            assert item["city"] == "Seattle"
            assert item["lat"] == 47.6062
            assert item["lon"] == -122.3321


def test_wmo_code_mapping():
    icon, condition = get_wmo_info(0)
    assert icon == "☀️"
    assert condition == "Clear Sky"

    icon_rain, condition_rain = get_wmo_info(61)
    assert icon_rain == "🌧️"
    assert condition_rain == "Slight Rain"

    icon_unknown, condition_unknown = get_wmo_info(9999)
    assert icon_unknown == "⛅"
    assert condition_unknown == "Partly Cloudy"


def test_day_label_helper():
    assert get_day_label("2026-07-21", 0) == "Today"
    assert get_day_label("2026-07-22", 1) == "Wed"
