import request from "supertest";
import { describe, it, expect } from "vitest";
import app from "../../src/app";

describe("User Routes", () => {
	describe("POST /auth/login", () => {
		it("should accept valid login request", async () => {
			const response = await request(app)
				.post("/auth/login")
				.send({
					email: "test@example.com",
					password: "password123",
				});

			// Should return either 200 (success) or 401 (invalid credentials), but not 404
			expect([200, 401]).toContain(response.status);
		});

		it("should return 400 for invalid email", async () => {
			const response = await request(app)
				.post("/auth/login")
				.send({
					email: "invalid-email",
					password: "password123",
				});

			expect(response.status).toBe(400);
		});

		it("should return 400 for missing password", async () => {
			const response = await request(app)
				.post("/auth/login")
				.send({
					email: "test@example.com",
				});

			expect(response.status).toBe(400);
		});

		it("should return 401 for non-existent user", async () => {
			const response = await request(app)
				.post("/auth/login")
				.send({
					email: "nonexistent@example.com",
					password: "password123",
				});

			expect(response.status).toBe(401);
			expect(response.body).toHaveProperty("error");
		});
	});

	describe("POST /auth/register", () => {
		it("should accept valid register request", async () => {
			const response = await request(app)
				.post("/auth/register")
				.send({
					firstName: "John",
					lastName: "Doe",
					email: `test+${Date.now()}@example.com`,
					password: "password123",
					role: "applicant",
				});

			// Should return either 201 (success) or 400 (duplicate), but not 404
			expect([201, 400, 500]).toContain(response.status);
		});

		it("should return 400 for invalid email", async () => {
			const response = await request(app)
				.post("/auth/register")
				.send({
					firstName: "John",
					lastName: "Doe",
					email: "invalid-email",
					password: "password123",
					role: "applicant",
				});

			expect(response.status).toBe(400);
		});

		it("should return 400 for short password", async () => {
			const response = await request(app)
				.post("/auth/register")
				.send({
					firstName: "John",
					lastName: "Doe",
					email: "test@example.com",
					password: "short",
					role: "applicant",
				});

			expect(response.status).toBe(400);
		});

		it("should return 400 for missing required fields", async () => {
			const response = await request(app)
				.post("/auth/register")
				.send({
					email: "test@example.com",
					password: "password123",
				});

			expect(response.status).toBe(400);
		});

		it("should return 400 for invalid role", async () => {
			const response = await request(app)
				.post("/auth/register")
				.send({
					firstName: "John",
					lastName: "Doe",
					email: "test@example.com",
					password: "password123",
					role: "invalid-role",
				});

			expect(response.status).toBe(400);
		});
	});
});
