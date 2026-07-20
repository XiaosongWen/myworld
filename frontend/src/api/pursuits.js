import client from "./client";

// Helper: unwrap the API's { data, pagination, request_id } envelope
function unwrap(response) {
  return response.data?.data ?? response.data;
}

// ── Commitments ────────────────────────────────────────────────────────────

export async function fetchCommitments(params = {}) {
  const res = await client.get("/pursuits/commitments", { params });
  return unwrap(res);
}

export async function createCommitment(payload) {
  const res = await client.post("/pursuits/commitments", payload);
  return unwrap(res);
}

export async function getCommitment(id) {
  const res = await client.get(`/pursuits/commitments/${id}`);
  return unwrap(res);
}

export async function updateCommitment(id, payload) {
  const res = await client.put(`/pursuits/commitments/${id}`, payload);
  return unwrap(res);
}

export async function deleteCommitment(id) {
  await client.delete(`/pursuits/commitments/${id}`);
}

export async function reorderCommitments(items) {
  // items: [{ id, sort_order }, ...]
  await client.put("/pursuits/commitments/reorder", items);
}

// ── Records ───────────────────────────────────────────────────────────────

export async function fetchRecords(params = {}) {
  const res = await client.get("/pursuits/records", { params });
  return unwrap(res);
}

export async function createRecord(payload) {
  // payload must include `date` (ISO string)
  const res = await client.post("/pursuits/records", payload);
  return unwrap(res);
}

export async function batchCreateRecords(records) {
  const res = await client.post("/pursuits/records/batch", { records });
  return unwrap(res);
}

export async function updateRecord(id, payload) {
  const res = await client.put(`/pursuits/records/${id}`, payload);
  return unwrap(res);
}

export async function deleteRecord(id) {
  await client.delete(`/pursuits/records/${id}`);
}

// ── Daily dashboard ───────────────────────────────────────────────────────

export async function fetchDaily(targetDate) {
  // targetDate: "YYYY-MM-DD"
  const res = await client.get(`/pursuits/daily/${targetDate}`);
  return unwrap(res);
}

// ── Heatmap ───────────────────────────────────────────────────────────────

export async function fetchHeatmap(fromDate, toDate) {
  const res = await client.get("/pursuits/heatmap", {
    params: { from: fromDate, to: toDate },
  });
  return unwrap(res);
}
