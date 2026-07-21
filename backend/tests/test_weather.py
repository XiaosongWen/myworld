import pytest
from httpx import ASGITransport, AsyncClient
from main import app
from services.weather_service import WMO_CODE_MAP, get_wmo_info, get_day_label


@pytest.mark.asyncio
async def test_weather_forecast_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/weather/forecast?lat=41.8781&lon=-87.6298")
        assert response.status_code == 200
        json_data = response.json()
        assert json_data["msg"] == "success"
        assert "request_id" in json_data
        assert isinstance(json_data["data"], list)
        assert len(json_data["data"]) == 5

        first_item = json_data["data"][0]
        assert first_item["label"] == "Today"
        assert "icon" in first_item
        assert "temp_f" in first_item
        assert "temp_c" in first_item
        assert "condition" in first_item


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
