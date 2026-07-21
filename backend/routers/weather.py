from typing import Optional
from fastapi import APIRouter, Query, Request

from schemas.response import SingleResponse
from schemas.weather import WeatherForecastResult
from services.weather_service import WeatherService

router = APIRouter(tags=["weather"])


@router.get("/api/v1/weather/forecast", response_model=SingleResponse[WeatherForecastResult])
async def get_weather_forecast(
    request: Request,
    lat: Optional[float] = Query(None),
    lon: Optional[float] = Query(None),
):
    client_ip = request.headers.get("x-forwarded-for")
    if client_ip:
        client_ip = client_ip.split(",")[0].strip()
    else:
        client_ip = request.client.host if request.client else None

    result = await WeatherService.get_forecast(client_ip=client_ip, lat=lat, lon=lon)
    request_id = getattr(request.state, "request_id", "UNKNOWN")
    return SingleResponse(request_id=request_id, data=result)
