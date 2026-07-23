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
    client_ip = request.headers.get("x-forwarded-for")
    if client_ip:
        client_ip = client_ip.split(",")[0].strip()
    else:
        client_ip = request.client.host if request.client else None

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
