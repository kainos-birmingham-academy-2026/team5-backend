import { hash, verify } from "argon2";
import jwt from "jsonwebtoken";
import { userDao } from "../daos/userDao";
import type { LoginResponseDto, RegisterRequestDto } from "../dtos/userDto";
import { UserMapper } from "../mappers/userMapper";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this";

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
		const user = UserMapper.toDomain(createdUser);
		const token = this.generateToken(user.id, user.email, user.roleId);

		return {
			user: UserMapper.toResponse(user),
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
		const user = UserMapper.toDomain(prismaUser);
		const token = this.generateToken(user.id, user.email, user.roleId);

		return {
			user: UserMapper.toResponse(user),
			token,
		};
	}

	private generateToken(userId: string, email: string, roleId: number): string {
		return jwt.sign(
			{
				userId,
				email,
				roleId,
			},
			JWT_SECRET,
			{
				expiresIn: "24h",
			},
		);
	}

	verifyToken(token: string): {
		userId: string;
		email: string;
		roleId: number;
	} {
		try {
			const decoded = jwt.verify(token, JWT_SECRET);
			return decoded as { userId: string; email: string; roleId: number };
		} catch {
			throw new Error("Invalid or expired token");
		}
	}
}

export const authenticationService = new AuthenticationService();
