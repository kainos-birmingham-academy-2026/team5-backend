import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthenticationService } from "../../src/services/authenticationService";
import { userDao } from "../../src/daos/userDao";
import bcrypt from "bcrypt";

vi.mock("../../src/daos/userDao");
vi.mock("bcrypt");

describe("AuthenticationService", () => {
	let service: AuthenticationService;

	beforeEach(() => {
		vi.resetAllMocks();
		service = new AuthenticationService();
	});

	describe("login", () => {
		it("should return user and token on successful login", async () => {
			const mockUser = {
				id: "user-1",
				firstName: "John",
				lastName: "Doe",
				email: "john@example.com",
				password: "hashed-password",
				roleId: "role-1",
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			vi.mocked(userDao.findByEmail).mockResolvedValue(mockUser);
			vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

			const result = await service.login(
				"john@example.com",
				"password123",
			);

			expect(result.user).toEqual({
				id: "user-1",
				firstName: "John",
				lastName: "Doe",
				email: "john@example.com",
				roleId: "role-1",
				createdAt: mockUser.createdAt,
				updatedAt: mockUser.updatedAt,
			});
			expect(result.token).toBeDefined();
			expect(result.token).toMatch(/^eyJ/); // JWT format check
		});

		it("should throw error if user not found", async () => {
			vi.mocked(userDao.findByEmail).mockResolvedValue(null);

			await expect(
				service.login("nonexistent@example.com", "password123"),
			).rejects.toThrow("Invalid email or password");
		});

		it("should throw error if password is incorrect", async () => {
			const mockUser = {
				id: "user-1",
				firstName: "John",
				lastName: "Doe",
				email: "john@example.com",
				password: "hashed-password",
				roleId: "role-1",
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			vi.mocked(userDao.findByEmail).mockResolvedValue(mockUser);
			vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

			await expect(
				service.login("john@example.com", "wrongpassword"),
			).rejects.toThrow("Invalid email or password");
		});
	});

	describe("register", () => {
		it("should throw error if user already exists", async () => {
			const existingUser = {
				id: "user-1",
				firstName: "John",
				lastName: "Doe",
				email: "john@example.com",
				password: "hashed-password",
				roleId: "role-1",
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			vi.mocked(userDao.findByEmail).mockResolvedValue(existingUser);

			await expect(
				service.register({
					firstName: "John",
					lastName: "Doe",
					email: "john@example.com",
					password: "password123",
					role: "applicant",
				}),
			).rejects.toThrow("User with this email already exists");
		});
	});

	describe("verifyToken", () => {
		it("should verify and decode valid token", () => {
			const token = service["generateToken"](
				"user-1",
				"john@example.com",
				"role-1",
			);
			const decoded = service.verifyToken(token);

			expect(decoded.userId).toBe("user-1");
			expect(decoded.email).toBe("john@example.com");
			expect(decoded.roleId).toBe("role-1");
		});

		it("should throw error for invalid token", () => {
			expect(() => service.verifyToken("invalid-token")).toThrow(
				"Invalid or expired token",
			);
		});
	});
});
