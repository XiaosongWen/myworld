import client from "./client";

export async function fetchWeatherForecast(lat, lon) {
  const params = {};
  if (lat != null) params.lat = lat;
  if (lon != null) params.lon = lon;

  const res = await client.get("/weather/forecast", { params });
  return res.data;
}
