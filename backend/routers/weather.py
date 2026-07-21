from fastapi import APIRouter, Query, Request

from schemas.response import ListResponse, Pagination
from schemas.weather import WeatherForecastItem
from services.weather_service import WeatherService

router = APIRouter(tags=["weather"])


@router.get("/api/v1/weather/forecast", response_model=ListResponse[WeatherForecastItem])
async def get_weather_forecast(
    request: Request,
    lat: float = Query(41.8781),
    lon: float = Query(-87.6298),
):
    items = await WeatherService.get_forecast(lat=lat, lon=lon)
    request_id = getattr(request.state, "request_id", "UNKNOWN")
    pagination = Pagination(page=1, page_size=len(items), total_rows=len(items))
    return ListResponse(request_id=request_id, data=items, pagination=pagination)
