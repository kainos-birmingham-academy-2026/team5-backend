import { type Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const userWithRoleInclude = { role: true } as const;

export type UserWithRole = Prisma.UserGetPayload<{
	include: typeof userWithRoleInclude;
}>;

export class UserDao {
	async findByEmail(email: string): Promise<UserWithRole | null> {
		return prisma.user.findUnique({
			where: { email },
			include: userWithRoleInclude,
		});
	}

	async findById(id: string): Promise<UserWithRole | null> {
		return prisma.user.findUnique({
			where: { id },
			include: userWithRoleInclude,
		});
	}

	async create(data: {
		email: string;
		password: string;
		roleId: number;
	}): Promise<UserWithRole> {
		return prisma.user.create({
			data,
			include: userWithRoleInclude,
		});
	}
}

export const userDao = new UserDao();
