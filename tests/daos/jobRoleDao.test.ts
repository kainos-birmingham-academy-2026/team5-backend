import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
	jobRole: {
		findMany: vi.fn(),
		count: vi.fn(),
	},
	capability: { findMany: vi.fn() },
	band: { findMany: vi.fn() },
}));

vi.mock("../../src/prismaClient", () => ({
	default: prismaMock,
}));

import { JobRoleDao } from "../../src/daos/jobRoleDao";
import { JobRole } from "../../src/models/jobRole";

describe("JobRoleDao", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	it("findAll applies skip and take and returns the total count", async () => {
		prismaMock.jobRole.findMany.mockResolvedValue([
			{
				jobRoleId: 11,
				roleName: "Platform Engineer",
				location: "Belfast",
				capabilityId: 1,
				bandId: 2,
				closingDate: "2027-12-31",
				status: "Open",
				capability: {
					capabilityId: 1,
					capabilityName: "Engineering",
				},
				band: { nameId: 2, bandName: "Band 2" },
			},
		]);
		prismaMock.jobRole.count.mockResolvedValue(23);

		const filters = {
			roleName: "platform",
			location: "Belfast",
			capability: ["Engineering"],
			band: ["Band 2"],
			status: ["Open"],
			closingDate: "2027-12-31",
		};
		const result = await new JobRoleDao().findAll(3, 5, filters);
		const where = {
			roleName: { contains: "platform", mode: "insensitive" },
			location: { contains: "Belfast", mode: "insensitive" },
			capability: {
				capabilityName: { in: ["Engineering"], mode: "insensitive" },
			},
			band: { bandName: { in: ["Band 2"], mode: "insensitive" } },
			status: { in: ["Open"], mode: "insensitive" },
			closingDate: "2027-12-31",
		};

		expect(prismaMock.jobRole.findMany).toHaveBeenCalledWith({
			include: { capability: true, band: true, statusRef: true },
			where,
			skip: 10,
			take: 5,
		});
		expect(prismaMock.jobRole.count).toHaveBeenCalledWith({ where });
		expect(result).toEqual({
			jobRoles: [
				new JobRole(
					11,
					"Platform Engineer",
					"Belfast",
					1,
					2,
					"2027-12-31",
					"Open",
					"Engineering",
					"Band 2",
				),
			],
			totalItems: 23,
		});
	});

	it("getFilterOptions returns sorted values from filterable fields", async () => {
		prismaMock.capability.findMany.mockResolvedValue([
			{ capabilityName: "Data" },
			{ capabilityName: "Engineering" },
		]);
		prismaMock.band.findMany.mockResolvedValue([
			{ bandName: "Band 1" },
			{ bandName: "Band 2" },
		]);
		prismaMock.jobRole.findMany.mockResolvedValue([
			{ status: "Closed" },
			{ status: "Open" },
		]);

		const result = await new JobRoleDao().getFilterOptions();

		expect(prismaMock.jobRole.findMany).toHaveBeenCalledWith({
			select: { status: true },
			distinct: ["status"],
			orderBy: { status: "asc" },
		});
		expect(result).toEqual({
			capabilities: ["Data", "Engineering"],
			bands: ["Band 1", "Band 2"],
			statuses: ["Closed", "Open"],
		});
	});
});
