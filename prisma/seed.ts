import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
	// Seed roles
	const roles = ["applicant", "recruiter", "admin"];

	for (const roleName of roles) {
		await prisma.role.upsert({
			where: { name: roleName },
			update: {},
			create: { name: roleName },
		});
	}

	// Seed John Doe user
	const hashedPassword = await bcrypt.hash("password123", 10);
	await prisma.user.upsert({
		where: { email: "john@example.com" },
		update: {},
		create: {
			firstName: "John",
			lastName: "Doe",
			email: "john@example.com",
			password: hashedPassword,
			roleId: 1,
		},
	});

	// Seed your database here
	await prisma.jobRole.createMany({
		data: [
			{
				roleName: "Software Engineer",
				location: "New York",
				capabilityId: 1,
				bandId: 2,
				closingDate: "2024-12-31",
				status: "Open",
			},
			{
				roleName: "Data Scientist",
				location: "San Francisco",
				capabilityId: 2,
				bandId: 3,
				closingDate: "2024-11-30",
				status: "Open",
			},
			{
				roleName: "Product Manager",
				location: "Chicago",
				capabilityId: 3,
				bandId: 4,
				closingDate: "2024-10-15",
				status: "Closed",
			},
		],
	});
}

main().finally(() => prisma.$disconnect());
