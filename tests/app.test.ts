import jwt from "jsonwebtoken";
import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../src/app";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
	throw new Error("JWT_SECRET environment variable is required for tests");
}

const authHeader = {
	Authorization: `Bearer ${jwt.sign(
		{
			userId: "user-1",
			email: "applicant@example.com",
			roleId: 1,
			role: "applicant",
		},
		JWT_SECRET,
	)}`,
};

describe("app routes", () => {
	it.each(["/", "/health"])("GET %s returns 401 without a token", async (path) => {
		const response = await request(app).get(path);

		expect(response.status).toBe(401);
		expect(response.body).toEqual({
			error: "Authentication token required",
		});
	});

	it("GET / returns welcome message with a valid token", async () => {
		const response = await request(app).get("/").set(authHeader);

		expect(response.status).toBe(200);
		expect(response.headers["content-type"]).toContain("application/json");
		expect(response.body).toEqual({ message: "Welcome to the API" });
	});

	it("GET /health returns status and timestamp with a valid token", async () => {
		const response = await request(app).get("/health").set(authHeader);

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
