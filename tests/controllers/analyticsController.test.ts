import type { Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

const loggerMock = vi.hoisted(() => ({ error: vi.fn() }));

vi.mock("../../src/lib/logger", () => ({ default: loggerMock }));

import { AnalyticsController } from "../../src/controllers/analyticsController";
import {
	AnalyticsRangeError,
	type AnalyticsService,
} from "../../src/services/analyticsService";

const createResponse = () => {
	const res = {
		status: vi.fn().mockReturnThis(),
		json: vi.fn().mockReturnThis(),
	};
	return res as unknown as Response & typeof res;
};

const createRequest = (query: Record<string, unknown>) =>
	({ query }) as unknown as Request;

describe("AnalyticsController", () => {
	const serviceMock = {
		getOverview: vi.fn(),
		getJobRoles: vi.fn(),
	};
	const controller = new AnalyticsController(
		serviceMock as unknown as AnalyticsService,
	);

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns the overview for a valid query", async () => {
		const overview = { range: { preset: "7d" } };
		serviceMock.getOverview.mockResolvedValue(overview);
		const res = createResponse();

		await controller.getOverview(createRequest({ preset: "7d" }), res);

		expect(serviceMock.getOverview).toHaveBeenCalledWith({
			preset: "7d",
			from: undefined,
			to: undefined,
		});
		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.json).toHaveBeenCalledWith(overview);
	});

	it("returns 400 with issue details for an invalid overview query", async () => {
		const res = createResponse();

		await controller.getOverview(createRequest({ preset: "custom" }), res);

		expect(serviceMock.getOverview).not.toHaveBeenCalled();
		expect(res.status).toHaveBeenCalledWith(400);
		expect(res.json).toHaveBeenCalledWith({
			error: "Invalid analytics query",
			details: expect.any(Array),
		});
	});

	it("returns 400 when the service rejects the resolved range", async () => {
		serviceMock.getOverview.mockRejectedValue(
			new AnalyticsRangeError("A custom range requires both from and to dates"),
		);
		const res = createResponse();

		await controller.getOverview(createRequest({ preset: "7d" }), res);

		expect(res.status).toHaveBeenCalledWith(400);
		expect(res.json).toHaveBeenCalledWith({
			error: "A custom range requires both from and to dates",
		});
	});

	it("returns a generic 500 and logs when the service fails unexpectedly", async () => {
		serviceMock.getOverview.mockRejectedValue(new Error("connection refused"));
		const res = createResponse();

		await controller.getOverview(createRequest({ preset: "7d" }), res);

		expect(res.status).toHaveBeenCalledWith(500);
		expect(res.json).toHaveBeenCalledWith({
			error: "Unable to load analytics",
		});
		expect(loggerMock.error).toHaveBeenCalledWith(
			"Failed to build analytics overview: connection refused",
		);
	});

	it("returns the paginated job role table for a valid query", async () => {
		const page = {
			items: [],
			page: 1,
			pageSize: 10,
			totalItems: 0,
			totalPages: 0,
		};
		serviceMock.getJobRoles.mockResolvedValue(page);
		const res = createResponse();

		await controller.getJobRoles(
			createRequest({ preset: "7d", capability: "Engineering" }),
			res,
		);

		expect(serviceMock.getJobRoles).toHaveBeenCalledWith(
			expect.objectContaining({
				preset: "7d",
				page: 1,
				pageSize: 10,
				sortBy: "applications",
				sortOrder: "desc",
				capability: ["Engineering"],
			}),
		);
		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.json).toHaveBeenCalledWith(page);
	});

	it("returns 400 with issue details for an invalid table query", async () => {
		const res = createResponse();

		await controller.getJobRoles(createRequest({ sortBy: "applicantId" }), res);

		expect(serviceMock.getJobRoles).not.toHaveBeenCalled();
		expect(res.status).toHaveBeenCalledWith(400);
		expect(res.json).toHaveBeenCalledWith({
			error: "Invalid analytics query",
			details: expect.any(Array),
		});
	});

	it("returns a generic 500 when the table query fails unexpectedly", async () => {
		serviceMock.getJobRoles.mockRejectedValue(new Error("timeout"));
		const res = createResponse();

		await controller.getJobRoles(createRequest({}), res);

		expect(res.status).toHaveBeenCalledWith(500);
		expect(res.json).toHaveBeenCalledWith({
			error: "Unable to load analytics",
		});
	});
});
