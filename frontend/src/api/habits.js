import client from "./client";

export async function fetchHabits(includeArchived = false) {
  const params = includeArchived ? { include_archived: true } : {};
  const { data } = await client.get("/habits", { params });
  return data;
}

export async function createHabit(habitData) {
  const { data } = await client.post("/habits", habitData);
  return data;
}

export async function getHabit(id) {
  const { data } = await client.get(`/habits/${id}`);
  return data;
}

export async function updateHabit(id, habitData) {
  const { data } = await client.patch(`/habits/${id}`, habitData);
  return data;
}

export async function archiveHabit(id) {
  await client.delete(`/habits/${id}`);
}

export async function checkIn(habitId, payload = {}) {
  const { data } = await client.post(`/habits/${habitId}/check-in`, payload);
  return data;
}

export async function archiveCheckIn(habitId, logId) {
  await client.delete(`/habits/${habitId}/check-in/${logId}`);
}

export async function getCheckIns(habitId, fromDate, toDate) {
  const { data } = await client.get(`/habits/${habitId}/check-ins`, {
    params: { from: fromDate, to: toDate },
  });
  return data;
}

export async function getStreaks(habitId) {
  const { data } = await client.get(`/habits/${habitId}/streaks`);
  return data;
}

export async function getHeatmap(fromDate, toDate) {
  const { data } = await client.get("/habits/heatmap", {
    params: { from: fromDate, to: toDate },
  });
  return data;
}
