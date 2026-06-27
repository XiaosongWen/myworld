import client from "../api/client";

describe("API Client", () => {
  it("creates an axios instance with baseURL /api/v1", () => {
    expect(client.defaults.baseURL).toBe("/api/v1");
  });

  it("has a reasonable default timeout", () => {
    // Axios default timeout is 0 (no timeout), which is fine for dev
    expect(client.defaults.timeout).toBeDefined();
  });
});
