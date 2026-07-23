import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { fetchWeatherForecast, searchWeatherLocations } from "../api/weather";
import client from "../api/client";
import DailyLog from "../views/DailyLog";

vi.mock("../api/client", () => ({
  default: {
    get: vi.fn(),
  },
}));

vi.mock("../stores/pursuitsStore", () => {
  return {
    default: () => ({
      daily: { habits: [], tasks: [], free_records: [] },
      commitments: [],
      fetchDaily: vi.fn(),
      fetchLabels: vi.fn(),
      fetchCommitments: vi.fn(),
      checkInHabit: vi.fn(),
      uncheckHabit: vi.fn(),
      createCommitment: vi.fn(),
      updateCommitment: vi.fn(),
    }),
  };
});

describe("Weather API and WeatherStrip", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    if (typeof window !== "undefined" && window.localStorage?.clear) {
      window.localStorage.clear();
    }
  });

  it("fetchWeatherForecast calls /weather/forecast endpoint and returns location and forecast", async () => {
    client.get.mockResolvedValueOnce({
      data: {
        msg: "success",
        request_id: "test",
        data: {
          location: { city: "Austin", region: "Texas", lat: 30.2672, lon: -97.7431 },
          forecast: [
            { label: "Today", date: "2026-07-21", icon: "☀️", temp_f: 75, temp_c: 24, high_f: 80, high_c: 27, low_f: 70, low_c: 21, condition: "Sunny" },
          ],
        },
      },
    });

    const res = await fetchWeatherForecast(30.2672, -97.7431);
    expect(client.get).toHaveBeenCalledWith("/weather/forecast", {
      params: { lat: 30.2672, lon: -97.7431 },
    });
    expect(res.location.city).toBe("Austin");
    expect(res.forecast[0].high_f).toBe(80);
  });

  it("searchWeatherLocations calls /weather/locations/search endpoint", async () => {
    client.get.mockResolvedValueOnce({
      data: {
        msg: "success",
        request_id: "test",
        data: [
          { city: "Austin", region: "Texas", country: "United States", lat: 30.2672, lon: -97.7431 },
        ],
      },
    });

    const res = await searchWeatherLocations("78701");
    expect(client.get).toHaveBeenCalledWith("/weather/locations/search", {
      params: { q: "78701" },
    });
    expect(res[0].city).toBe("Austin");
  });

  it("renders resolved city location in DailyLog header and displays high/low temperatures", async () => {
    client.get.mockResolvedValueOnce({
      data: {
        msg: "success",
        request_id: "test",
        data: {
          location: { city: "Seattle", region: "Washington", lat: 47.6062, lon: -122.3321 },
          forecast: [
            { label: "Today", date: "2026-07-21", icon: "☀️", temp_f: 75, temp_c: 24, high_f: 80, high_c: 27, low_f: 70, low_c: 21, condition: "Sunny" },
            { label: "Wed", date: "2026-07-22", icon: "⛅", temp_f: 78, temp_c: 26, high_f: 82, high_c: 28, low_f: 72, low_c: 22, condition: "Partly Cloudy" },
          ],
        },
      },
    });

    render(<DailyLog />);

    await waitFor(() => {
      expect(screen.getByText("Seattle, Washington")).toBeInTheDocument();
      expect(screen.getByText("80°")).toBeInTheDocument();
      expect(screen.getByText("/ 70°")).toBeInTheDocument();
      expect(screen.getByText("82°")).toBeInTheDocument();
      expect(screen.getByText("/ 72°")).toBeInTheDocument();
    });

    const toggleBtn = screen.getByTitle("Toggle °F / °C");
    expect(toggleBtn).toHaveTextContent("°F");

    fireEvent.click(toggleBtn);

    expect(screen.getByText("27°")).toBeInTheDocument();
    expect(screen.getByText("/ 21°")).toBeInTheDocument();
    expect(screen.getByText("28°")).toBeInTheDocument();
    expect(screen.getByText("/ 22°")).toBeInTheDocument();
    expect(toggleBtn).toHaveTextContent("°C");
  });
});
