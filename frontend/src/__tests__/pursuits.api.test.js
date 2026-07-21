import { describe, it, expect, vi, beforeEach } from "vitest";
import * as pursuitsApi from "../api/pursuits";
import client from "../api/client";

vi.mock("../api/client", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("Pursuits API", () => {
  beforeEach(() => vi.clearAllMocks());

  it("fetchCommitments fetches with correct path", async () => {
    client.get.mockResolvedValueOnce({ data: { data: [{ id: 1 }] } });
    const data = await pursuitsApi.fetchCommitments({ type: "habit" });
    expect(client.get).toHaveBeenCalledWith("/pursuits/commitments", { params: { type: "habit" } });
    expect(data).toEqual([{ id: 1 }]);
  });

  it("createCommitment posts to correct path", async () => {
    client.post.mockResolvedValueOnce({ data: { data: { id: 2 } } });
    const data = await pursuitsApi.createCommitment({ title: "Read" });
    expect(client.post).toHaveBeenCalledWith("/pursuits/commitments", { title: "Read" });
    expect(data).toEqual({ id: 2 });
  });

  it("batchCreateRecords wraps records in object", async () => {
    client.post.mockResolvedValueOnce({ data: { data: [{ id: 1 }] } });
    const data = await pursuitsApi.batchCreateRecords([{ content: "Test", date: "2026-07-20" }]);
    expect(client.post).toHaveBeenCalledWith("/pursuits/records/batch", {
      records: [{ content: "Test", date: "2026-07-20" }],
    });
    expect(data).toEqual([{ id: 1 }]);
  });

  it("fetchDaily fetches the daily endpoint", async () => {
    client.get.mockResolvedValueOnce({ data: { data: { date: "2026-07-20", habits: [], tasks: [], free_records: [] } } });
    const data = await pursuitsApi.fetchDaily("2026-07-20");
    expect(client.get).toHaveBeenCalledWith("/pursuits/daily/2026-07-20");
    expect(data.date).toBe("2026-07-20");
  });
});
