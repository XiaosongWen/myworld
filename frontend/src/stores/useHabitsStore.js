import { create } from "zustand";
import * as habitsApi from "../api/habits";

const useHabitsStore = create((set, get) => ({
  habits: [],
  heatmapData: [],
  loading: false,
  error: null,

  fetchHabits: async (includeArchived = false) => {
    set({ loading: true, error: null });
    try {
      const habits = await habitsApi.fetchHabits(includeArchived);
      set({ habits, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  createHabit: async (habitData) => {
    try {
      const habit = await habitsApi.createHabit(habitData);
      set((state) => ({ habits: [habit, ...state.habits] }));
      return habit;
    } catch (err) {
      set({ error: err.message });
      throw err;
    }
  },

  updateHabit: async (id, habitData) => {
    try {
      const habit = await habitsApi.updateHabit(id, habitData);
      set((state) => ({
        habits: state.habits.map((h) => (h.id === id ? habit : h)),
      }));
      return habit;
    } catch (err) {
      set({ error: err.message });
      throw err;
    }
  },

  archiveHabit: async (id) => {
    try {
      await habitsApi.archiveHabit(id);
      set((state) => ({
        habits: state.habits.filter((h) => h.id !== id),
      }));
    } catch (err) {
      set({ error: err.message });
      throw err;
    }
  },

  checkIn: async (habitId, payload = {}) => {
    try {
      const log = await habitsApi.checkIn(habitId, payload);
      return log;
    } catch (err) {
      set({ error: err.message });
      throw err;
    }
  },

  fetchHeatmap: async (fromDate, toDate) => {
    try {
      const data = await habitsApi.getHeatmap(fromDate, toDate);
      set({ heatmapData: data });
    } catch (err) {
      set({ error: err.message });
    }
  },
}));

export default useHabitsStore;
