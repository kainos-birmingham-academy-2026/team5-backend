import { hash, verify } from "argon2";
import "dotenv/config";
import jwt from "jsonwebtoken";
import { userDao } from "../daos/userDao";
import type { LoginResponseDto, RegisterRequestDto } from "../dtos/userDto";
import { toDomain, toResponse } from "../mappers/userMapper";
import type { AuthUser } from "../types/auth";

function getJwtSecret(): string {
	const jwtSecret = process.env.JWT_SECRET;

	if (!jwtSecret) {
		throw new Error("JWT_SECRET environment variable is required");
	}

	return jwtSecret;
}

const JWT_SECRET = getJwtSecret();

export class AuthenticationService {
	async register(data: RegisterRequestDto): Promise<LoginResponseDto> {
		// Check if user already exists
		const existingUser = await userDao.findByEmail(data.email);
		if (existingUser) {
			throw new Error("User with this email already exists");
		}

		// Hash password with argon2
		const hashedPassword = await hash(data.password);

		// Create user with default roleId of 1 (applicant)
		const createdUser = await userDao.create({
			email: data.email,
			password: hashedPassword,
			roleId: 1,
		});

		// Map to domain and generate token
		const user = toDomain(createdUser);
		const token = this.generateToken(
			user.id,
			user.email,
			user.roleId,
			user.role,
		);

		return {
			user: toResponse(user),
			token,
		};
	}

	async login(email: string, password: string): Promise<LoginResponseDto> {
		// Find user by email
		const prismaUser = await userDao.findByEmail(email);
		if (!prismaUser) {
			throw new Error("Invalid email or password");
		}

		// Verify password with argon2
		const isPasswordValid = await verify(prismaUser.password, password);
		if (!isPasswordValid) {
			throw new Error("Invalid email or password");
		}

		// Map to domain and generate token
		const user = toDomain(prismaUser);
		const token = this.generateToken(
			user.id,
			user.email,
			user.roleId,
			user.role,
		);

		return {
			user: toResponse(user),
			token,
		};
	}

	private generateToken(
		userId: string,
		email: string,
		roleId: number,
		role: string,
	): string {
		return jwt.sign(
			{
				userId,
				email,
				roleId,
				role,
			},
			JWT_SECRET,
			{
				expiresIn: "24h",
			},
		);
	}

	verifyToken(token: string): AuthUser {
		try {
			const decoded = jwt.verify(token, JWT_SECRET);
			return decoded as AuthUser;
		} catch {
			throw new Error("Invalid or expired token");
		}
	}
}

export const authenticationService = new AuthenticationService();
