import type { Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { UserController } from "../../src/controllers/userController";
import { userDao } from "../../src/daos/userDao";
import { authenticationService } from "../../src/services/authenticationService";

vi.mock("../../src/services/authenticationService");
vi.mock("../../src/daos/userDao");

describe("UserController", () => {
	let controller: UserController;

	const createMockReq = (overrides?: Partial<Request>): Request =>
		({
			params: {},
			body: {},
			...overrides,
		}) as Request;

	const createMockRes = (): Response => {
		const res = {} as Response;
		res.status = vi.fn().mockReturnValue(res);
		res.json = vi.fn().mockReturnValue(res);
		return res;
	};

	beforeEach(() => {
		vi.resetAllMocks();
		controller = new UserController();
	});

	describe("login", () => {
		it("should return 200 with user and token on successful login", async () => {
			const mockLoginResponse = {
				user: {
					id: "user-1",
					firstName: "John",
					lastName: "Doe",
					email: "john@example.com",
					roleId: 1,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				token: "jwt-token-123",
			};

			vi.mocked(authenticationService.login).mockResolvedValue(
				mockLoginResponse,
			);

			const req = createMockReq({
				body: {
					email: "john@example.com",
					password: "password123",
				},
			});
			const res = createMockRes();

			await controller.login(req, res);

			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith(mockLoginResponse);
		});

		it("should return 400 on validation error", async () => {
			const req = createMockReq({
				body: {
					email: "invalid-email",
					password: "",
				},
			});
			const res = createMockRes();

			await controller.login(req, res);

			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalled();
			const call = (res.json as any).mock.calls[0][0];
			expect(call).toHaveProperty("error");
		});

		it("should return 401 on authentication error", async () => {
			vi.mocked(authenticationService.login).mockRejectedValue(
				new Error("Invalid email or password"),
			);

			const req = createMockReq({
				body: {
					email: "john@example.com",
					password: "wrongpassword",
				},
			});
			const res = createMockRes();

			await controller.login(req, res);

			expect(res.status).toHaveBeenCalledWith(401);
			expect(res.json).toHaveBeenCalledWith(
				expect.objectContaining({
					error: "Invalid email or password",
				}),
			);
		});

		it("should return 401 on authentication error without message", async () => {
			vi.mocked(authenticationService.login).mockRejectedValue(new Error());

			const req = createMockReq({
				body: {
					email: "john@example.com",
					password: "wrongpassword",
				},
			});
			const res = createMockRes();

			await controller.login(req, res);

			expect(res.status).toHaveBeenCalledWith(401);
			expect(res.json).toHaveBeenCalled();
		});

		it("should return 401 on non-Error authentication failure", async () => {
			vi.mocked(authenticationService.login).mockRejectedValue("Some error");

			const req = createMockReq({
				body: {
					email: "john@example.com",
					password: "wrongpassword",
				},
			});
			const res = createMockRes();

			await controller.login(req, res);

			expect(res.status).toHaveBeenCalledWith(401);
			expect(res.json).toHaveBeenCalledWith(
				expect.objectContaining({
					error: "Login failed",
				}),
			);
		});
	});

	describe("register", () => {
		it("should return 201 with user and token on successful registration", async () => {
			const mockRegisterResponse = {
				user: {
					id: "user-1",
					firstName: "Jane",
					lastName: "Doe",
					email: "jane@example.com",
					roleId: 1,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				token: "jwt-token-456",
			};

			vi.mocked(authenticationService.register).mockResolvedValue(
				mockRegisterResponse,
			);

			const req = createMockReq({
				body: {
					firstName: "Jane",
					lastName: "Doe",
					email: "jane@example.com",
					password: "password123",
					role: "applicant",
				},
			});
			const res = createMockRes();

			await controller.register(req, res);

			expect(res.status).toHaveBeenCalledWith(201);
			expect(res.json).toHaveBeenCalledWith(mockRegisterResponse);
		});

		it("should return 400 on validation error", async () => {
			const req = createMockReq({
				body: {
					firstName: "Jane",
					lastName: "Doe",
					email: "invalid-email",
					password: "short",
				},
			});
			const res = createMockRes();

			await controller.register(req, res);

			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalled();
			const call = (res.json as any).mock.calls[0][0];
			expect(call).toHaveProperty("error");
		});

		it("should return 400 on registration error (duplicate email)", async () => {
			vi.mocked(authenticationService.register).mockRejectedValue(
				new Error("User with this email already exists"),
			);

			const req = createMockReq({
				body: {
					firstName: "Jane",
					lastName: "Doe",
					email: "jane@example.com",
					password: "password123",
					role: "applicant",
				},
			});
			const res = createMockRes();

			await controller.register(req, res);

			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith(
				expect.objectContaining({
					error: "User with this email already exists",
				}),
			);
		});

		it("should return 400 on registration error without message", async () => {
			vi.mocked(authenticationService.register).mockRejectedValue(new Error());

			const req = createMockReq({
				body: {
					firstName: "Jane",
					lastName: "Doe",
					email: "jane@example.com",
					password: "password123",
					role: "applicant",
				},
			});
			const res = createMockRes();

			await controller.register(req, res);

			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalled();
		});

		it("should return 400 on non-Error registration failure", async () => {
			vi.mocked(authenticationService.register).mockRejectedValue("Some error");

			const req = createMockReq({
				body: {
					firstName: "Jane",
					lastName: "Doe",
					email: "jane@example.com",
					password: "password123",
					role: "applicant",
				},
			});
			const res = createMockRes();

			await controller.register(req, res);

			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith(
				expect.objectContaining({
					error: "Registration failed",
				}),
			);
		});
	});

	describe("getUser", () => {
		it("should return 200 with user data on successful retrieval", async () => {
			const mockUser = {
				id: "user-1",
				firstName: "John",
				lastName: "Doe",
				email: "john@example.com",
				password: "hashed-password",
				roleId: 1,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			vi.mocked(userDao.findById).mockResolvedValue(mockUser);

			const req = createMockReq({
				params: { id: "user-1" },
			});
			const res = createMockRes();

			await controller.getUser(req, res);

			expect(userDao.findById).toHaveBeenCalledWith("user-1");
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalled();
			const call = (res.json as any).mock.calls[0][0];
			expect(call).toHaveProperty("id");
			expect(call).toHaveProperty("firstName", "John");
		});

		it("should return 404 when user is not found", async () => {
			vi.mocked(userDao.findById).mockResolvedValue(null);

			const req = createMockReq({
				params: { id: "non-existent-id" },
			});
			const res = createMockRes();

			await controller.getUser(req, res);

			expect(res.status).toHaveBeenCalledWith(404);
			expect(res.json).toHaveBeenCalledWith({
				error: "User not found",
			});
		});

		it("should return 400 when user ID is missing", async () => {
			const req = createMockReq({
				params: {},
			});
			const res = createMockRes();

			await controller.getUser(req, res);

			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith({
				error: "User ID is required",
			});
		});

		it("should return 500 on database error", async () => {
			vi.mocked(userDao.findById).mockRejectedValue(
				new Error("Database connection failed"),
			);

			const req = createMockReq({
				params: { id: "user-1" },
			});
			const res = createMockRes();

			await controller.getUser(req, res);

			expect(res.status).toHaveBeenCalledWith(500);
			expect(res.json).toHaveBeenCalledWith({
				error: "Database connection failed",
			});
		});

		it("should handle array params by taking the first element", async () => {
			const mockUser = {
				id: "user-1",
				firstName: "John",
				lastName: "Doe",
				email: "john@example.com",
				password: "hashed-password",
				roleId: 1,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			vi.mocked(userDao.findById).mockResolvedValue(mockUser);

			const req = createMockReq({
				params: { id: ["user-1", "user-2"] as any },
			});
			const res = createMockRes();

			await controller.getUser(req, res);

			expect(userDao.findById).toHaveBeenCalledWith("user-1");
			expect(res.status).toHaveBeenCalledWith(200);
		});

		it("should return 500 on non-Error database failure", async () => {
			vi.mocked(userDao.findById).mockRejectedValue("DB error");

			const req = createMockReq({
				params: { id: "user-1" },
			});
			const res = createMockRes();

			await controller.getUser(req, res);

			expect(res.status).toHaveBeenCalledWith(500);
			expect(res.json).toHaveBeenCalledWith(
				expect.objectContaining({
					error: "Failed to retrieve user",
				}),
			);
		});
	});
});
