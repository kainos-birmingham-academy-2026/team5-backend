import { PrismaClient } from "@prisma/client";
import { hash } from "argon2";

const prisma = new PrismaClient();

async function main() {
	await prisma.jobRole.deleteMany();
	await prisma.capability.deleteMany();
	await prisma.band.deleteMany();

	const engineering = await prisma.capability.create({
		data: { capabilityName: "Engineering" },
	});
	const data = await prisma.capability.create({
		data: { capabilityName: "Data" },
	});
	const product = await prisma.capability.create({
		data: { capabilityName: "Product" },
	});

	const bands = await Promise.all(
		["Band 1", "Band 2", "Band 3", "Band 4"].map((bandName) =>
			prisma.band.create({ data: { bandName } }),
		),
	);

	await prisma.jobRole.createMany({
		data: [
			{
				roleName: "Software Engineer",
				location: "New York",
				capabilityId: engineering.capabilityId,
				bandId: bands[1].nameId,
				closingDate: "2027-12-31",
				status: "Open",
			},
			{
				roleName: "Data Scientist",
				location: "San Francisco",
				capabilityId: data.capabilityId,
				bandId: bands[2].nameId,
				closingDate: "2027-11-30",
				status: "Open",
			},
			{
				roleName: "Product Manager",
				location: "Chicago",
				capabilityId: product.capabilityId,
				bandId: bands[3].nameId,
				closingDate: "2027-10-15",
				status: "Closed",
			},
		],
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
