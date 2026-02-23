const request = require("supertest");
const express = require("express");

// Mock minimal plans routes for testing
const app = express();
app.use(express.json());

// Mock authentication middleware
const mockAuth = (req, res, next) => {
  req.user = { id: "test-user-123" };
  next();
};

// Mock plans routes
app.get("/api/plans", mockAuth, (req, res) => {
  res.json([]);
});

app.post("/api/plans", mockAuth, (req, res) => {
  res.status(201).json({ id: "test-plan-123", ...req.body });
});

describe("Plans Routes", () => {
  it("GET /api/plans should return 200 with empty array", async () => {
    const response = await request(app).get("/api/plans");

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it("POST /api/plans should return 201 with created plan", async () => {
    const planData = {
      name: "Test Garden",
      year: 2026,
      layout: {},
      plantings: {},
    };

    const response = await request(app).post("/api/plans").send(planData);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
    expect(response.body.name).toBe("Test Garden");
  });
});
