from pydantic import BaseModel


class WeatherForecastItem(BaseModel):
    label: str
    date: str
    icon: str
    temp_f: int
    temp_c: int
    condition: str
