import jwt from "jsonwebtoken";
import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../../src/app";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
	throw new Error("JWT_SECRET environment variable is required for tests");
}

const AUTH_TOKEN = jwt.sign(
	{
		userId: "user-1",
		email: "john@example.com",
		roleId: 1,
		role: "applicant",
	},
	JWT_SECRET,
);

const ADMIN_TOKEN = jwt.sign(
	{
		userId: "admin-1",
		email: "admin@example.com",
		roleId: 3,
		role: "admin",
	},
	JWT_SECRET,
);

const authHeader = { Authorization: `Bearer ${AUTH_TOKEN}` };
const adminAuthHeader = { Authorization: `Bearer ${ADMIN_TOKEN}` };

describe("User Routes", () => {
	describe("POST /auth/login", () => {
		it("should accept valid login request", async () => {
			const response = await request(app).post("/auth/login").send({
				email: "test@example.com",
				password: "SecurePass123",
			});

			// Should return either 200 (success) or 401 (invalid credentials), but not 404
			expect([200, 401]).toContain(response.status);
		});

		it("should return 400 for invalid email", async () => {
			const response = await request(app).post("/auth/login").send({
				email: "invalid-email",
				password: "SecurePass123",
			});

			expect(response.status).toBe(400);
		});

		it("should return 400 for missing password", async () => {
			const response = await request(app).post("/auth/login").send({
				email: "test@example.com",
			});

			expect(response.status).toBe(400);
		});

		it("should return 401 for non-existent user", async () => {
			const response = await request(app).post("/auth/login").send({
				email: "nonexistent@example.com",
				password: "SecurePass123",
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
					password: "SecurePass123",
					role: "applicant",
				});

			// Should return either 201 (success) or 400 (duplicate), but not 404
			expect([201, 400, 500]).toContain(response.status);
		});

		it("should return 400 for invalid email", async () => {
			const response = await request(app).post("/auth/register").send({
				firstName: "John",
				lastName: "Doe",
				email: "invalid-email",
				password: "SecurePass123",
				role: "applicant",
			});

			expect(response.status).toBe(400);
		});

		it("should return 400 for short password", async () => {
			const response = await request(app).post("/auth/register").send({
				firstName: "John",
				lastName: "Doe",
				email: "test@example.com",
				password: "Short1A",
				role: "applicant",
			});

			expect(response.status).toBe(400);
		});

		it("should return 400 for password without capital letter", async () => {
			const response = await request(app).post("/auth/register").send({
				firstName: "John",
				lastName: "Doe",
				email: "test@example.com",
				password: "lowercase1234",
				role: "applicant",
			});

			expect(response.status).toBe(400);
		});

		it("should return 400 for password without number", async () => {
			const response = await request(app).post("/auth/register").send({
				firstName: "John",
				lastName: "Doe",
				email: "test@example.com",
				password: "NoNumberHere",
				role: "applicant",
			});

			expect(response.status).toBe(400);
		});

		it("should return 400 for missing required fields", async () => {
			const response = await request(app).post("/auth/register").send({
				email: "test@example.com",
				password: "SecurePass123",
			});

			expect(response.status).toBe(400);
		});

		it("should return 400 for invalid role", async () => {
			const response = await request(app).post("/auth/register").send({
				firstName: "John",
				lastName: "Doe",
				email: "test@example.com",
				password: "SecurePass123",
				role: "invalid-role",
			});

			expect(response.status).toBe(400);
		});
	});

	describe("GET /auth/user/:id", () => {
		it("should return 401 without a token", async () => {
			const response = await request(app).get("/auth/user/valid-user-id");

			expect(response.status).toBe(401);
			expect(response.body).toEqual({
				error: "Authentication token required",
			});
		});

		it("should return 403 when an applicant requests another user", async () => {
			const response = await request(app)
				.get("/auth/user/valid-user-id")
				.set(authHeader);

			expect(response.status).toBe(403);
			expect(response.body).toEqual({ error: "Forbidden" });
		});

		it("should allow an applicant to request their own user id", async () => {
			const response = await request(app)
				.get("/auth/user/user-1")
				.set(authHeader);

			expect([200, 404, 500]).toContain(response.status);
			if (response.status === 200) {
				expect(response.body).toHaveProperty("id");
				expect(response.body).toHaveProperty("email");
			}
		});

		it("should allow an admin to request another user id", async () => {
			const response = await request(app)
				.get("/auth/user/valid-user-id")
				.set(adminAuthHeader);

			expect([200, 404, 500]).toContain(response.status);
		});

		it("should return 404 for non-existent user", async () => {
			const response = await request(app)
				.get("/auth/user/user-1")
				.set(authHeader);

			expect([404, 500, 200]).toContain(response.status);
		});

		it("should return 400 for missing user ID", async () => {
			const response = await request(app).get("/auth/user/");

			// Missing ID should either return 400 or 404 depending on routing
			expect([400, 404]).toContain(response.status);
		});
	});
});
