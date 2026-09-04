import * as argon2 from "argon2";
import jwt from "jsonwebtoken";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { userDao } from "../../src/daos/userDao";
import { AuthenticationService } from "../../src/services/authenticationService";

vi.mock("../../src/daos/userDao");
vi.mock("argon2");

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
				email: "john@example.com",
				password: "hashed-password",
				roleId: 1,
				createdAt: new Date(),
				updatedAt: new Date(),
				role: { id: 1, name: "applicant", createdAt: new Date(), updatedAt: new Date() },
			};

			vi.mocked(userDao.findByEmail).mockResolvedValue(mockUser);
			vi.mocked(argon2.verify).mockResolvedValue(true);

			const result = await service.login("john@example.com", "password123");

			expect(result.user).toEqual({
				id: "user-1",
				email: "john@example.com",
				roleId: 1,
				role: "applicant",
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
				email: "john@example.com",
				password: "hashed-password",
				roleId: 1,
				createdAt: new Date(),
				updatedAt: new Date(),
				role: { id: 1, name: "applicant", createdAt: new Date(), updatedAt: new Date() },
			};

			vi.mocked(userDao.findByEmail).mockResolvedValue(mockUser);
			vi.mocked(argon2.verify).mockResolvedValue(false);

			await expect(
				service.login("john@example.com", "wrongpassword"),
			).rejects.toThrow("Invalid email or password");
		});
	});

	describe("register", () => {
		it("should hash the password, create the user, and return a token", async () => {
			const createdAt = new Date();
			const updatedAt = new Date();
			vi.mocked(userDao.findByEmail).mockResolvedValue(null);
			vi.mocked(argon2.hash).mockResolvedValue("hashed-password");
			vi.mocked(userDao.create).mockResolvedValue({
				id: "user-1",
				email: "john@example.com",
				password: "hashed-password",
				roleId: 1,
				createdAt,
				updatedAt,
				role: { id: 1, name: "applicant", createdAt, updatedAt },
			});

			const result = await service.register({
				email: "john@example.com",
				password: "SecurePass@123",
			});

			expect(argon2.hash).toHaveBeenCalledWith("SecurePass@123");
			expect(userDao.create).toHaveBeenCalledWith({
				email: "john@example.com",
				password: "hashed-password",
				roleId: 1,
			});
			expect(result.user).toEqual({
				id: "user-1",
				email: "john@example.com",
				roleId: 1,
				role: "applicant",
				createdAt,
				updatedAt,
			});
			expect(result.token).toMatch(/^eyJ/);
		});

		it("should throw error if user already exists", async () => {
			const existingUser = {
				id: "user-1",
				email: "john@example.com",
				password: "hashed-password",
				roleId: 1,
				createdAt: new Date(),
				role: { id: 1, name: "applicant", createdAt: new Date(), updatedAt: new Date() },
				updatedAt: new Date(),
			};

			vi.mocked(userDao.findByEmail).mockResolvedValue(existingUser);

			await expect(
				service.register({
					email: "john@example.com",
					password: "SecurePass@123",
				}),
			).rejects.toThrow("User with this email already exists");
		});
	});

	describe("verifyToken", () => {
		it("should verify and decode valid token", () => {
			const token = jwt.sign(
				{
					userId: "user-1",
					email: "john@example.com",
					roleId: 1,
					role: "applicant",
				},
				process.env.JWT_SECRET || "your-secret-key-change-this",
			);
			const decoded = service.verifyToken(token);

			expect(decoded.userId).toBe("user-1");
			expect(decoded.email).toBe("john@example.com");
			expect(decoded.roleId).toBe(1);
			expect(decoded.role).toBe("applicant");
		});

		it("should throw error for invalid token", () => {
			expect(() => service.verifyToken("invalid-token")).toThrow(
				"Invalid or expired token",
			);
		});
	});
});
