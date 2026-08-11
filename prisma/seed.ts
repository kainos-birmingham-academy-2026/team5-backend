import { PrismaClient } from "@prisma/client";
import { hash } from "argon2";

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

	// Seed John Doe user with argon2 hashed password
	const hashedPassword = await hash("SecurePass123");
	await prisma.user.upsert({
		where: { email: "john@example.com" },
		update: { password: hashedPassword },
		create: {
			firstName: "John",
			lastName: "Doe",
			email: "john@example.com",
			password: hashedPassword,
			roleId: 1,
		},
	});

	console.log(
		"✅ Seed completed: Roles and user data seeded with argon2 hashed passwords",
	);
}

main().finally(() => prisma.$disconnect());
