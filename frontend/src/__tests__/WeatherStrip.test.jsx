import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { fetchWeatherForecast } from "../api/weather";
import client from "../api/client";
import DailyLog from "../views/DailyLog";
import usePursuitsStore from "../stores/pursuitsStore";

vi.mock("../api/client", () => ({
  default: {
    get: vi.fn(),
  },
}));

// Mock pursuitsStore to prevent unnecessary network calls during DailyLog render
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

  it("fetchWeatherForecast calls /weather/forecast endpoint", async () => {
    client.get.mockResolvedValueOnce({
      data: {
        msg: "success",
        request_id: "test",
        data: [
          { label: "Today", date: "2026-07-21", icon: "☀️", temp_f: 75, temp_c: 24, condition: "Sunny" },
        ],
      },
    });

    const res = await fetchWeatherForecast(41.8781, -87.6298);
    expect(client.get).toHaveBeenCalledWith("/weather/forecast", {
      params: { lat: 41.8781, lon: -87.6298 },
    });
    expect(res.data[0].temp_f).toBe(75);
  });

  it("renders weather forecast strip in DailyLog and toggles units", async () => {
    client.get.mockResolvedValueOnce({
      data: {
        msg: "success",
        request_id: "test",
        data: [
          { label: "Today", date: "2026-07-21", icon: "☀️", temp_f: 75, temp_c: 24, condition: "Sunny" },
          { label: "Wed", date: "2026-07-22", icon: "⛅", temp_f: 78, temp_c: 26, condition: "Partly Cloudy" },
        ],
      },
    });

    render(<DailyLog />);

    await waitFor(() => {
      expect(screen.getByText("75°")).toBeInTheDocument();
      expect(screen.getByText("78°")).toBeInTheDocument();
    });

    const toggleBtn = screen.getByTitle("Toggle °F / °C");
    expect(toggleBtn).toHaveTextContent("°F");

    fireEvent.click(toggleBtn);

    expect(screen.getByText("24°")).toBeInTheDocument();
    expect(screen.getByText("26°")).toBeInTheDocument();
    expect(toggleBtn).toHaveTextContent("°C");
  });
});
