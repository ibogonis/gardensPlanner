const request = require("supertest");
const express = require("express");

// Create a minimal app for health check test
const app = express();
app.get("/", (req, res) => res.send("API is running"));

describe("Health Check", () => {
  it("GET / should return 200 and API is running message", async () => {
    const response = await request(app).get("/");
    expect(response.status).toBe(200);
    expect(response.text).toBe("API is running");
  });
});
