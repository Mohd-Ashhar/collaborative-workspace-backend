require("../setup");
const request = require("supertest");

// Mock the app to avoid loading heavy dependencies
jest.mock("../../src/services/queue.service", () => ({
  getQueueService: jest.fn(() => ({
    addJob: jest.fn(),
    getQueue: jest.fn(),
  })),
}));

const app = require("../../src/app");

describe("Authentication Integration Tests", () => {
  let testUser = {
    email: `test${Date.now()}@example.com`,
    password: "Test@12345",
    name: "Test User",
  };

  let accessToken;
  let refreshToken;

  describe("Health Check", () => {
    it("should return 200 for health endpoint", async () => {
      const res = await request(app).get("/health").expect(200);

      expect(res.body.status).toBe("OK");
    });
  });

  describe("API Documentation", () => {
    it("should serve swagger docs", async () => {
      const res = await request(app).get("/api-docs.json").expect(200);

      expect(res.body.openapi).toBe("3.0.0");
      expect(res.body.info.title).toBeDefined();
    });
  });

  describe("POST /api/v1/auth/register", () => {
    it("should fail with weak password", async () => {
      const res = await request(app)
        .post("/api/v1/auth/register")
        .send({
          email: "test@example.com",
          password: "weak",
          name: "Test",
        })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it("should fail with invalid email", async () => {
      const res = await request(app)
        .post("/api/v1/auth/register")
        .send({
          email: "invalid-email",
          password: "Test@12345",
          name: "Test",
        })
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  describe("POST /api/v1/auth/login", () => {
    it("should fail without credentials", async () => {
      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({})
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  describe("GET /api/v1/auth/profile", () => {
    it("should fail without token", async () => {
      const res = await request(app).get("/api/v1/auth/profile").expect(401);

      expect(res.body.success).toBe(false);
    });

    it("should fail with invalid token", async () => {
      const res = await request(app)
        .get("/api/v1/auth/profile")
        .set("Authorization", "Bearer invalid_token")
        .expect(401);

      expect(res.body.success).toBe(false);
    });
  });
});
