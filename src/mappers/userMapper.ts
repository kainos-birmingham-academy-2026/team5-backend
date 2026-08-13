import type { User as PrismaUser } from "@prisma/client";
import { User } from "../models/user";
import type { UserResponse } from "../models/userResponse";

export class UserMapper {
	static toDomain(prismaUser: PrismaUser): User {
		return new User(
			prismaUser.id,
			prismaUser.email,
			prismaUser.password,
			prismaUser.roleId,
			prismaUser.createdAt,
			prismaUser.updatedAt,
		);
	}

	static toResponse(user: User): UserResponse {
		return {
			id: user.id,
			email: user.email,
			roleId: user.roleId,
			createdAt: user.createdAt,
			updatedAt: user.updatedAt,
		};
	}

	static toPersistence(
		user: User,
	): Omit<PrismaUser, "createdAt" | "updatedAt"> {
		return {
			id: user.id,
			email: user.email,
			password: user.password,
			roleId: user.roleId,
		};
	}
}
