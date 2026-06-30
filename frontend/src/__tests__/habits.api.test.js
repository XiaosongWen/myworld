import { describe, it, expect, vi, beforeEach } from "vitest";
import client from "../api/client";

vi.mock("../api/client");

const {
  fetchHabits, createHabit, getHabit, updateHabit, archiveHabit,
  checkIn, getStreaks, getHeatmap,
} = await import("../api/habits");

describe("habits API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetchHabits calls GET /habits", async () => {
    client.get.mockResolvedValue({ data: [] });
    const result = await fetchHabits();
    expect(client.get).toHaveBeenCalledWith("/habits", { params: {} });
    expect(result).toEqual([]);
  });

  it("createHabit calls POST /habits", async () => {
    const habit = { name: "Run", color: "#3B82F6" };
    client.post.mockResolvedValue({ data: { id: 1, ...habit } });
    const result = await createHabit(habit);
    expect(client.post).toHaveBeenCalledWith("/habits", habit);
    expect(result.id).toBe(1);
  });

  it("checkIn calls POST /habits/{id}/check-in", async () => {
    client.post.mockResolvedValue({ data: { id: 1 } });
    const result = await checkIn(1, { note: "Good" });
    expect(client.post).toHaveBeenCalledWith("/habits/1/check-in", { note: "Good" });
    expect(result.id).toBe(1);
  });

  it("getStreaks calls GET /habits/{id}/streaks", async () => {
    client.get.mockResolvedValue({ data: { current_streak: 5 } });
    const result = await getStreaks(1);
    expect(client.get).toHaveBeenCalledWith("/habits/1/streaks");
    expect(result.current_streak).toBe(5);
  });

  it("getHeatmap calls GET /habits/heatmap", async () => {
    client.get.mockResolvedValue({ data: [] });
    await getHeatmap("2026-01-01", "2026-12-31");
    expect(client.get).toHaveBeenCalledWith("/habits/heatmap", {
      params: { from: "2026-01-01", to: "2026-12-31" },
    });
  });
});
