import client from "./client";

function unwrap(response) {
  return response.data?.data ?? response.data;
}

export async function fetchLabels() {
  const res = await client.get("/labels");
  return unwrap(res);
}

export async function createLabel(name, color = "#3b82f6", description = null) {
  const res = await client.post("/labels", { name, color, description });
  return unwrap(res);
}
