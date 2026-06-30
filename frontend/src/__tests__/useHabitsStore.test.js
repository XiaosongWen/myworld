import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import useHabitsStore from "../stores/useHabitsStore";
import * as habitsApi from "../api/habits";

vi.mock("../api/habits");

describe("useHabitsStore", () => {
  beforeEach(() => {
    act(() => useHabitsStore.getState().habits.length && useHabitsStore.setState({ habits: [], heatmapData: [], loading: false, error: null }));
  });

  it("fetchHabits sets habits on success", async () => {
    const mockHabits = [{ id: 1, name: "Run" }];
    habitsApi.fetchHabits.mockResolvedValue(mockHabits);

    await act(async () => {
      await useHabitsStore.getState().fetchHabits();
    });

    const state = useHabitsStore.getState();
    expect(state.habits).toEqual(mockHabits);
    expect(state.loading).toBe(false);
  });

  it("createHabit prepends habit", async () => {
    useHabitsStore.setState({ habits: [] });
    const newHabit = { id: 1, name: "Run" };
    habitsApi.createHabit.mockResolvedValue(newHabit);

    await act(async () => {
      await useHabitsStore.getState().createHabit({ name: "Run" });
    });

    expect(useHabitsStore.getState().habits).toEqual([newHabit]);
  });
});
