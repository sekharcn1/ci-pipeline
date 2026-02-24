const request = require("supertest");
const app = require("./app");

describe("CI Pipeline App", () => {
  test("GET / returns hello message", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.text).toContain("Hello from CI Pipeline App");
  });

  test("GET /health returns healthy status", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("healthy");
    expect(res.body.version).toBeDefined();
  });
});
