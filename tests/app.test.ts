import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../src/app";

describe("app routes", () => {
	it("GET / returns welcome message", async () => {
		const response = await request(app).get("/");

		expect(response.status).toBe(200);
		expect(response.headers["content-type"]).toContain("application/json");
		expect(response.body).toEqual({ message: "Welcome to the API" });
	});

	it("GET /health returns status and timestamp", async () => {
		const response = await request(app).get("/health");

		expect(response.status).toBe(200);
		expect(response.body.status).toBe("UP");
		expect(response.body).toHaveProperty("timestamp");
		expect(typeof response.body.timestamp).toBe("string");
		expect(response.body.timestamp.length).toBeGreaterThan(0);
	});

	it("unknown routes return 404", async () => {
		const response = await request(app).get("/does-not-exist");

		expect(response.status).toBe(404);
	});
});
