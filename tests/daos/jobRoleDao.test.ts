import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
	jobRole: {
		findMany: vi.fn(),
		count: vi.fn(),
	},
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

		const result = await new JobRoleDao().findAll(3, 5);

		expect(prismaMock.jobRole.findMany).toHaveBeenCalledWith({
			include: { capability: true, band: true, statusRef: true },
			skip: 10,
			take: 5,
		});
		expect(prismaMock.jobRole.count).toHaveBeenCalledOnce();
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
});
