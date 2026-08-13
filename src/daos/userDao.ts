import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class UserDao {
	async findByEmail(email: string) {
		return prisma.user.findUnique({
			where: { email },
		});
	}

	async findById(id: string) {
		return prisma.user.findUnique({
			where: { id },
		});
	}

	async create(data: {
		email: string;
		password: string;
		roleId: number;
	}) {
		return prisma.user.create({
			data,
		});
	}
}

export const userDao = new UserDao();
