from pydantic import BaseModel
from typing import List


class LocationInfo(BaseModel):
    city: str
    region: str
    lat: float
    lon: float


class LocationSearchResult(BaseModel):
    city: str
    region: str
    country: str
    lat: float
    lon: float


class WeatherForecastItem(BaseModel):
    label: str
    date: str
    icon: str
    temp_f: int
    temp_c: int
    condition: str


class WeatherForecastResult(BaseModel):
    location: LocationInfo
    forecast: List[WeatherForecastItem]
