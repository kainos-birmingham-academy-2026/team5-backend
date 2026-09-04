import type { NextFunction, Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	authMiddleware,
	requireRole,
} from "../../src/middleware/authMiddleware";
import { authenticationService } from "../../src/services/authenticationService";

vi.mock("../../src/services/authenticationService", () => ({
	authenticationService: {
		verifyToken: vi.fn(),
	},
}));

describe("authMiddleware", () => {
	const createMockRes = (): Response => {
		const res = {} as Response;
		res.status = vi.fn().mockReturnValue(res);
		res.json = vi.fn().mockReturnValue(res);
		return res;
	};

	beforeEach(() => {
		vi.resetAllMocks();
	});

	it("returns 401 when Authorization header is missing", () => {
		const req = { headers: {} } as Request;
		const res = createMockRes();
		const next = vi.fn() as NextFunction;

		authMiddleware(req, res, next);

		expect(res.status).toHaveBeenCalledWith(401);
		expect(res.json).toHaveBeenCalledWith({
			error: "Authentication token required",
		});
		expect(next).not.toHaveBeenCalled();
	});

	it("returns 401 when Authorization header is not Bearer", () => {
		const req = {
			headers: { authorization: "Basic abc" },
		} as Request;
		const res = createMockRes();
		const next = vi.fn() as NextFunction;

		authMiddleware(req, res, next);

		expect(res.status).toHaveBeenCalledWith(401);
		expect(res.json).toHaveBeenCalledWith({
			error: "Authentication token required",
		});
		expect(next).not.toHaveBeenCalled();
	});

	it("returns 401 when Bearer token is empty", () => {
		const req = {
			headers: { authorization: "Bearer " },
		} as Request;
		const res = createMockRes();
		const next = vi.fn() as NextFunction;

		authMiddleware(req, res, next);

		expect(res.status).toHaveBeenCalledWith(401);
		expect(res.json).toHaveBeenCalledWith({
			error: "Authentication token required",
		});
		expect(next).not.toHaveBeenCalled();
	});

	it("attaches the user and calls next for a valid token", () => {
		const user = {
			userId: "user-1",
			email: "john@example.com",
			roleId: 1,
			role: "applicant",
		};
		vi.mocked(authenticationService.verifyToken).mockReturnValue(user);

		const req = {
			headers: { authorization: "Bearer valid-token" },
		} as Request;
		const res = createMockRes();
		const next = vi.fn() as NextFunction;

		authMiddleware(req, res, next);

		expect(authenticationService.verifyToken).toHaveBeenCalledWith(
			"valid-token",
		);
		expect(req.user).toEqual(user);
		expect(next).toHaveBeenCalled();
	});

	it("returns 401 for an invalid token", () => {
		vi.mocked(authenticationService.verifyToken).mockImplementation(() => {
			throw new Error("Invalid or expired token");
		});

		const req = {
			headers: { authorization: "Bearer bad-token" },
		} as Request;
		const res = createMockRes();
		const next = vi.fn() as NextFunction;

		authMiddleware(req, res, next);

		expect(res.status).toHaveBeenCalledWith(401);
		expect(res.json).toHaveBeenCalledWith({
			error: "Invalid or expired token",
		});
		expect(next).not.toHaveBeenCalled();
	});
});

describe("requireRole", () => {
	const createMockRes = (): Response => {
		const res = {} as Response;
		res.status = vi.fn().mockReturnValue(res);
		res.json = vi.fn().mockReturnValue(res);
		return res;
	};

	it("returns 401 when no user is on the request", () => {
		const req = {} as Request;
		const res = createMockRes();
		const next = vi.fn() as NextFunction;

		requireRole("admin")(req, res, next);

		expect(res.status).toHaveBeenCalledWith(401);
		expect(res.json).toHaveBeenCalledWith({
			error: "Authentication token required",
		});
		expect(next).not.toHaveBeenCalled();
	});

	it("returns 403 when the user role is not allowed", () => {
		const req = {
			user: {
				userId: "user-1",
				email: "john@example.com",
				roleId: 1,
				role: "applicant",
			},
		} as Request;
		const res = createMockRes();
		const next = vi.fn() as NextFunction;

		requireRole("admin")(req, res, next);

		expect(res.status).toHaveBeenCalledWith(403);
		expect(res.json).toHaveBeenCalledWith({ error: "Forbidden" });
		expect(next).not.toHaveBeenCalled();
	});

	it("calls next when the user role is allowed", () => {
		const req = {
			user: {
				userId: "admin-1",
				email: "admin@example.com",
				roleId: 3,
				role: "admin",
			},
		} as Request;
		const res = createMockRes();
		const next = vi.fn() as NextFunction;

		requireRole("admin")(req, res, next);

		expect(next).toHaveBeenCalled();
	});
});
