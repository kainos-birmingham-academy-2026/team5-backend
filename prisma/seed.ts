import { PrismaClient } from "@prisma/client";
import { hash } from "argon2";

const prisma = new PrismaClient();

async function main() {
	const roles = ["applicant", "recruiter", "admin"];
	const roleIds = new Map<string, number>();

	for (const roleName of roles) {
		const role = await prisma.role.upsert({
			where: { name: roleName },
			update: {},
			create: { name: roleName },
		});
		roleIds.set(roleName, role.id);
	}

	const capabilityIds = new Map<string, number>();
	for (const capabilityName of ["Engineering", "Data", "Product"]) {
		const existing = await prisma.capability.findFirst({
			where: { capabilityName },
		});
		const capability =
			existing ??
			(await prisma.capability.create({ data: { capabilityName } }));
		capabilityIds.set(capabilityName, capability.capabilityId);
	}

	const bandIds = new Map<string, number>();
	for (const bandName of ["Band 1", "Band 2", "Band 3", "Band 4"]) {
		const existing = await prisma.band.findFirst({ where: { bandName } });
		const band = existing ?? (await prisma.band.create({ data: { bandName } }));
		bandIds.set(bandName, band.nameId);
	}

	const statusIds = new Map<string, number>();
	for (const statusName of ["Open", "Closed"]) {
		const existing = await prisma.status.findFirst({ where: { statusName } });
		const status =
			existing ?? (await prisma.status.create({ data: { statusName } }));
		statusIds.set(statusName, status.statusId);
	}

	const hashedPassword = await hash("SecurePass123");
	const applicantRoleId = roleIds.get("applicant");
	const recruiterRoleId = roleIds.get("recruiter");

	if (!applicantRoleId || !recruiterRoleId) {
		throw new Error("Required roles were not seeded correctly");
	}

	// Seed John Doe (applicant)
	const johnPassword = await hash("SecurePass@123");
	await prisma.user.upsert({
		where: { email: "john@example.com" },
		update: { password: johnPassword },
		create: {
			email: "john@example.com",
			password: johnPassword,
			roleId: applicantRoleId,
		},
	});

	const jobRoles = [
		{
			roleName: "Software Engineer",
			location: "New York",
			capabilityName: "Engineering",
			bandName: "Band 2",
			closingDate: "2027-12-31",
			status: "Open",
			description: "Build and maintain backend services for hiring workflows.",
			responsibilities:
				"Design APIs, write tests, and collaborate with frontend teams.",
			sharepointUrl:
				"https://sharepoint.local/job-specifications/software-engineer",
			numberOfOpenPositions: 3,
		},
		{
			roleName: "Data Scientist",
			location: "San Francisco",
			capabilityName: "Data",
			bandName: "Band 3",
			closingDate: "2027-11-30",
			status: "Open",
			description:
				"Analyze recruitment trends and build candidate scoring models.",
			responsibilities:
				"Prepare datasets, train models, and present insights to stakeholders.",
			sharepointUrl:
				"https://sharepoint.local/job-specifications/data-scientist",
			numberOfOpenPositions: 2,
		},
		{
			roleName: "Product Manager",
			location: "Chicago",
			capabilityName: "Product",
			bandName: "Band 4",
			closingDate: "2027-10-15",
			status: "Closed",
			description:
				"Own product roadmap for applicant and recruiter experiences.",
			responsibilities:
				"Prioritize backlog, define requirements, and run delivery ceremonies.",
			sharepointUrl:
				"https://sharepoint.local/job-specifications/product-manager",
			numberOfOpenPositions: 0,
		},
	];
	// Seed Jane Smith (recruiter)
	const janePassword = await hash("RecruitPass#456");
	await prisma.user.upsert({
		where: { email: "jane@example.com" },
		update: { password: janePassword },
		create: {
			email: "jane@example.com",
			password: janePassword,
			roleId: recruiterRoleId,
		},
	});

	await prisma.jobRole.deleteMany();

	for (const { capabilityName, bandName, ...jobRole } of jobRoles) {
		const capabilityId = capabilityIds.get(capabilityName);
		const bandId = bandIds.get(bandName);
		const statusId = statusIds.get(jobRole.status);

		if (!capabilityId || !bandId || !statusId) {
			throw new Error(`Lookup data is missing for ${jobRole.roleName}`);
		}

		const data = { ...jobRole, capabilityId, bandId, statusId };
		const existing = await prisma.jobRole.findFirst({
			where: { roleName: jobRole.roleName, location: jobRole.location },
		});

		if (existing) {
			await prisma.jobRole.update({
				where: { jobRoleId: existing.jobRoleId },
				data,
			});
		} else {
			await prisma.jobRole.create({ data });
		}
	}

	console.log("Seed completed without deleting existing development data.");
}

main().finally(() => prisma.$disconnect());
