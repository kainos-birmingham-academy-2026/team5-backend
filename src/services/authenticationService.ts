import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { userDao } from "../daos/userDao";
import { UserMapper } from "../mappers/userMapper";
import type { LoginResponseDto, RegisterRequestDto } from "../dtos/userDto";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this";
const SALT_ROUNDS = 10;

export class AuthenticationService {
	async register(data: RegisterRequestDto): Promise<LoginResponseDto> {
		// Check if user already exists
		const existingUser = await userDao.findByEmail(data.email);
		if (existingUser) {
			throw new Error("User with this email already exists");
		}

		// Hash password
		const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

		// Get role ID from role name (assuming roles are already seeded)
		const { PrismaClient } = await import("@prisma/client");
		const prisma = new PrismaClient();

		const role = await prisma.role.findUnique({
			where: { name: data.role },
		});

		if (!role) {
			throw new Error(`Role "${data.role}" does not exist`);
		}

		// Create user
		const createdUser = await userDao.create({
			firstName: data.firstName,
			lastName: data.lastName,
			email: data.email,
			password: hashedPassword,
			roleId: role.id,
		});

		// Map to domain and generate token
		const user = UserMapper.toDomain(createdUser);
		const token = this.generateToken(user.id, user.email, user.roleId);

		return {
			user: UserMapper.toResponse(user),
			token,
		};
	}

	async login(
		email: string,
		password: string,
	): Promise<LoginResponseDto> {
		// Find user by email
		const prismaUser = await userDao.findByEmail(email);
		if (!prismaUser) {
			throw new Error("Invalid email or password");
		}

		// Compare passwords
		const isPasswordValid = await bcrypt.compare(password, prismaUser.password);
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

	private generateToken(userId: string, email: string, roleId: string): string {
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

	verifyToken(token: string): { userId: string; email: string; roleId: string } {
		try {
			const decoded = jwt.verify(token, JWT_SECRET);
			return decoded as { userId: string; email: string; roleId: string };
		} catch {
			throw new Error("Invalid or expired token");
		}
	}
}

export const authenticationService = new AuthenticationService();
