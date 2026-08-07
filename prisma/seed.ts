import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
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
