import { describe, it, expect, vi, beforeEach } from "vitest";
import usePursuitsStore from "../stores/pursuitsStore";
import * as pursuitsApi from "../api/pursuits";

vi.mock("../api/pursuits", () => ({
  fetchCommitments: vi.fn(),
  createCommitment: vi.fn(),
  fetchRecords: vi.fn(),
  createRecord: vi.fn(),
}));

describe("usePursuitsStore", () => {
  beforeEach(() => {
    usePursuitsStore.setState({ commitments: [], records: [], loading: false, error: null });
    vi.clearAllMocks();
  });

  it("fetches commitments and updates state", async () => {
    pursuitsApi.fetchCommitments.mockResolvedValueOnce([{ id: 1, title: "Test Goal" }]);
    const store = usePursuitsStore.getState();
    await store.fetchCommitments();
    
    const newState = usePursuitsStore.getState();
    expect(newState.commitments).toEqual([{ id: 1, title: "Test Goal" }]);
    expect(newState.loading).toBe(false);
  });

  it("creates commitment and appends to bottom of state", async () => {
    usePursuitsStore.setState({ commitments: [{ id: 1 }] });
    pursuitsApi.createCommitment.mockResolvedValueOnce({ id: 2 });
    
    const store = usePursuitsStore.getState();
    await store.createCommitment({ title: "New" });
    
    const newState = usePursuitsStore.getState();
    expect(newState.commitments).toHaveLength(2);
    expect(newState.commitments[1].id).toBe(2); // appended to bottom
  });
});
