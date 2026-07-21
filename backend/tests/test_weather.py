import pytest
from httpx import ASGITransport, AsyncClient
from main import app
from services.weather_service import WMO_CODE_MAP, get_wmo_info, get_day_label, WeatherService


@pytest.mark.asyncio
async def test_weather_forecast_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/weather/forecast")
        assert response.status_code == 200
        json_data = response.json()
        assert json_data["msg"] == "success"
        assert "request_id" in json_data
        assert "location" in json_data["data"]
        assert "forecast" in json_data["data"]

        location = json_data["data"]["location"]
        assert "city" in location
        assert "region" in location

        forecast = json_data["data"]["forecast"]
        assert len(forecast) == 5

        first_item = forecast[0]
        assert first_item["label"] == "Today"
        assert "icon" in first_item
        assert "temp_f" in first_item
        assert "temp_c" in first_item
        assert "condition" in first_item


@pytest.mark.asyncio
async def test_weather_forecast_endpoint_with_lat_lon():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/weather/forecast?lat=30.2672&lon=-97.7431")
        assert response.status_code == 200
        json_data = response.json()
        location = json_data["data"]["location"]
        assert location["lat"] == 30.2672
        assert location["lon"] == -97.7431


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
