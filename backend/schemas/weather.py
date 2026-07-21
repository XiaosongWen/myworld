from pydantic import BaseModel
from typing import List, Optional


class LocationInfo(BaseModel):
    city: str
    region: str
    lat: float
    lon: float
    timezone: Optional[str] = None


class LocationSearchResult(BaseModel):
    city: str
    region: str
    country: str
    lat: float
    lon: float
    timezone: Optional[str] = None


class WeatherForecastItem(BaseModel):
    label: str
    date: str
    icon: str
    temp_f: int
    temp_c: int
    high_f: int
    high_c: int
    low_f: int
    low_c: int
    condition: str


class WeatherForecastResult(BaseModel):
    location: LocationInfo
    forecast: List[WeatherForecastItem]
