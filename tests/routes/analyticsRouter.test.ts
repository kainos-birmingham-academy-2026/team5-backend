import jwt from "jsonwebtoken";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const serviceMock = vi.hoisted(() => ({
	getOverview: vi.fn(),
	getJobRoles: vi.fn(),
}));

vi.mock("../../src/services/analyticsService.js", async (importOriginal) => {
	const actual =
		await importOriginal<
			typeof import("../../src/services/analyticsService")
		>();
	return {
		...actual,
		AnalyticsService: vi.fn(function AnalyticsServiceMock() {
			return serviceMock;
		}),
	};
});

import app from "../../src/app";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
	throw new Error("JWT_SECRET environment variable is required for tests");
}

const applicantHeader = {
	Authorization: `Bearer ${jwt.sign(
		{
			userId: "user-1",
			email: "john@example.com",
			roleId: 1,
			role: "applicant",
		},
		JWT_SECRET,
	)}`,
};

const adminHeader = {
	Authorization: `Bearer ${jwt.sign(
		{ userId: "admin-1", email: "admin@example.com", roleId: 3, role: "admin" },
		JWT_SECRET,
	)}`,
};

describe("Analytics Routes", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	it("GET /analytics/overview returns 401 without a token", async () => {
		const response = await request(app).get("/analytics/overview");

		expect(response.status).toBe(401);
		expect(serviceMock.getOverview).not.toHaveBeenCalled();
	});

	it("GET /analytics/overview returns 403 for an applicant", async () => {
		const response = await request(app)
			.get("/analytics/overview")
			.set(applicantHeader);

		expect(response.status).toBe(403);
		expect(serviceMock.getOverview).not.toHaveBeenCalled();
	});

	it("GET /analytics/overview returns 200 for an admin", async () => {
		const overview = { range: { preset: "30d" } };
		serviceMock.getOverview.mockResolvedValue(overview);

		const response = await request(app)
			.get("/analytics/overview")
			.set(adminHeader);

		expect(response.status).toBe(200);
		expect(response.body).toEqual(overview);
		expect(serviceMock.getOverview).toHaveBeenCalledWith({
			preset: "30d",
			from: undefined,
			to: undefined,
		});
	});

	it("GET /analytics/overview returns 400 with details for an invalid range", async () => {
		const response = await request(app)
			.get("/analytics/overview")
			.query({ preset: "custom", from: "2026-03-01", to: "2026-02-01" })
			.set(adminHeader);

		expect(response.status).toBe(400);
		expect(response.body.error).toBe("Invalid analytics query");
		expect(Array.isArray(response.body.details)).toBe(true);
	});

	it("GET /analytics/job-roles returns 401 without a token", async () => {
		const response = await request(app).get("/analytics/job-roles");

		expect(response.status).toBe(401);
	});

	it("GET /analytics/job-roles returns 403 for an applicant", async () => {
		const response = await request(app)
			.get("/analytics/job-roles")
			.set(applicantHeader);

		expect(response.status).toBe(403);
	});

	it("GET /analytics/job-roles returns 200 for an admin", async () => {
		const page = {
			items: [],
			page: 1,
			pageSize: 10,
			totalItems: 0,
			totalPages: 0,
		};
		serviceMock.getJobRoles.mockResolvedValue(page);

		const response = await request(app)
			.get("/analytics/job-roles")
			.query({ preset: "7d", sortBy: "roleName", sortOrder: "asc" })
			.set(adminHeader);

		expect(response.status).toBe(200);
		expect(response.body).toEqual(page);
		expect(serviceMock.getJobRoles).toHaveBeenCalledWith(
			expect.objectContaining({
				preset: "7d",
				sortBy: "roleName",
				sortOrder: "asc",
			}),
		);
	});
});
