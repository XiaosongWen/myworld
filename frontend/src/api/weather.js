import client from "./client";

export async function fetchWeatherForecast(lat, lon) {
  const params = {};
  if (lat != null) params.lat = lat;
  if (lon != null) params.lon = lon;

  const res = await client.get("/weather/forecast", { params });
  return res?.data?.data; // Returns { location: { city, region, lat, lon }, forecast: [...] }
}

export async function searchWeatherLocations(query) {
  if (!query || !query.trim()) return [];
  const res = await client.get("/weather/locations/search", { params: { q: query.trim() } });
  return res?.data?.data || [];
}
