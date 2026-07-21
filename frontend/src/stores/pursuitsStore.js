import { create } from "zustand";
import * as pursuitsApi from "../api/pursuits";
import { fetchLabels } from "../api/labels";

const today = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const usePursuitsStore = create((set, get) => ({
  commitments: [],
  records: [],
  labels: [],
  daily: null, // DailyResponse from /daily/{date}
  loading: false,
  error: null,

  fetchLabels: async () => {
    try {
      const data = await fetchLabels();
      set({ labels: Array.isArray(data) ? data : [] });
    } catch (err) {
      console.error("Failed to fetch labels:", err);
    }
  },

  fetchCommitments: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const data = await pursuitsApi.fetchCommitments(params);
      set({ commitments: Array.isArray(data) ? data : [], loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  createCommitment: async (payload) => {
    try {
      const commitment = await pursuitsApi.createCommitment(payload);
      set((state) => ({ commitments: [...state.commitments, commitment] }));
      return commitment;
    } catch (err) {
      set({ error: err.message });
      throw err;
    }
  },

  updateCommitment: async (id, payload) => {
    try {
      const updated = await pursuitsApi.updateCommitment(id, payload);
      set((state) => ({
        commitments: state.commitments.map((c) => (c.id === id ? updated : c)),
      }));
      // Also update inside daily if present
      if (get().daily) {
        const d = get().daily;
        set({
          daily: {
            ...d,
            habits: d.habits.map((h) =>
              h.commitment.id === id ? { ...h, commitment: updated } : h
            ),
            tasks: d.tasks.map((t) => (t.id === id ? updated : t)),
          },
        });
      }
      return updated;
    } catch (err) {
      set({ error: err.message });
      throw err;
    }
  },

  deleteCommitment: async (id) => {
    try {
      await pursuitsApi.deleteCommitment(id);
      set((state) => ({
        commitments: state.commitments.filter((c) => c.id !== id),
      }));
    } catch (err) {
      set({ error: err.message });
      throw err;
    }
  },

  // ── Daily dashboard ─────────────────────────────────────────────────────

  fetchDaily: async (targetDate = today()) => {
    set({ loading: true, error: null });
    try {
      const data = await pursuitsApi.fetchDaily(targetDate);
      set({ daily: data, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  // ── Records ──────────────────────────────────────────────────────────────

  fetchRecords: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const data = await pursuitsApi.fetchRecords(params);
      set({ records: Array.isArray(data) ? data : [], loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  createRecord: async (payload) => {
    // Ensure date is always provided
    const withDate = { date: today(), ...payload };
    try {
      const record = await pursuitsApi.createRecord(withDate);
      set((state) => ({ records: [record, ...state.records] }));
      // If it's a free record, add to daily too
      if (!record.commitment_id && get().daily) {
        set((state) => ({
          daily: {
            ...state.daily,
            free_records: [record, ...(state.daily?.free_records || [])],
          },
        }));
      }
      return record;
    } catch (err) {
      set({ error: err.message });
      throw err;
    }
  },

  // Check-in a habit: create a record linked to the commitment
  checkInHabit: async (commitmentId) => {
    const payload = {
      commitment_id: commitmentId,
      date: today(),
      status: "done",
    };
    try {
      const record = await pursuitsApi.createRecord(payload);
      // Re-fetch daily and active commitments to get updated streak counts from backend
      await Promise.all([
        get().fetchDaily(today()),
        get().fetchCommitments({ status: "active" }),
        get().fetchRecords({ status: "done" }),
      ]);
      return record;
    } catch (err) {
      set({ error: err.message });
      throw err;
    }
  },

  // Undo a habit check-in
  uncheckHabit: async (commitmentId, recordId) => {
    try {
      await pursuitsApi.deleteRecord(recordId);
      await Promise.all([
        get().fetchDaily(today()),
        get().fetchCommitments({ status: "active" }),
        get().fetchRecords({ status: "done" }),
      ]);
    } catch (err) {
      set({ error: err.message });
      throw err;
    }
  },

  updateRecord: async (id, payload) => {
    try {
      const updated = await pursuitsApi.updateRecord(id, payload);
      set((state) => ({
        records: state.records.map((r) => (r.id === id ? updated : r)),
      }));
      return updated;
    } catch (err) {
      set({ error: err.message });
      throw err;
    }
  },

  deleteRecord: async (id) => {
    try {
      await pursuitsApi.deleteRecord(id);
      set((state) => ({
        records: state.records.filter((r) => r.id !== id),
      }));
    } catch (err) {
      set({ error: err.message });
      throw err;
    }
  },

  batchCreateRecords: async (payloads) => {
    try {
      const newRecords = await pursuitsApi.batchCreateRecords(payloads);
      set((state) => ({
        records: [...(Array.isArray(newRecords) ? newRecords : []), ...state.records],
      }));
      return newRecords;
    } catch (err) {
      set({ error: err.message });
      throw err;
    }
  },
}));

export default usePursuitsStore;
