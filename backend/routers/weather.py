from typing import Optional
from fastapi import APIRouter, Query, Request

from schemas.response import ListResponse, Pagination, SingleResponse
from schemas.weather import LocationSearchResult, WeatherForecastResult
from services.weather_service import WeatherService

router = APIRouter(tags=["weather"])


@router.get("/api/v1/weather/forecast", response_model=SingleResponse[WeatherForecastResult])
async def get_weather_forecast(
    request: Request,
    lat: Optional[float] = Query(None),
    lon: Optional[float] = Query(None),
):
    remote_host = request.client.host if request.client else None
    client_ip = remote_host

    # Only trust X-Forwarded-For if request comes from local/proxy host
    if remote_host in ("127.0.0.1", "::1") or (remote_host and (remote_host.startswith("10.") or remote_host.startswith("192.168.") or remote_host.startswith("172."))):
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            client_ip = forwarded.split(",")[0].strip()

    result = await WeatherService.get_forecast(client_ip=client_ip, lat=lat, lon=lon)
    request_id = getattr(request.state, "request_id", "UNKNOWN")
    return SingleResponse(request_id=request_id, data=result)


@router.get("/api/v1/weather/locations/search", response_model=ListResponse[LocationSearchResult])
async def search_weather_locations(
    request: Request,
    q: str = Query(..., min_length=1, max_length=100),
):
    results = await WeatherService.search_locations(query=q)
    request_id = getattr(request.state, "request_id", "UNKNOWN")
    pagination = Pagination(page=1, page_size=len(results), total_rows=len(results))
    return ListResponse(request_id=request_id, data=results, pagination=pagination)
