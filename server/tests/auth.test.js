const request = require("supertest");
const express = require("express");

// Mock minimal auth routes for testing
const app = express();
app.use(express.json());

// Mock auth routes
app.post("/api/auth/logout", (req, res) => {
  res.json({ message: "Logged out" });
});

describe("Auth Routes", () => {
  it("POST /api/auth/logout should return 200", async () => {
    const response = await request(app).post("/api/auth/logout").send({});

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("message");
  });
});
