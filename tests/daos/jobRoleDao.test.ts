import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
	jobRole: {
		findMany: vi.fn(),
		count: vi.fn(),
		findUnique: vi.fn(),
		create: vi.fn(),
		update: vi.fn(),
		delete: vi.fn(),
	},
	capability: { findMany: vi.fn(), findUnique: vi.fn() },
	band: { findMany: vi.fn(), findUnique: vi.fn() },
	status: { findUnique: vi.fn() },
}));

vi.mock("../../src/prismaClient", () => ({
	default: prismaMock,
}));

import { JobRoleDao } from "../../src/daos/jobRoleDao";
import { JobRole } from "../../src/models/jobRole";

describe("JobRoleDao", () => {
	const jobRoleRecord = {
		jobRoleId: 11,
		roleName: "Platform Engineer",
		location: "Belfast",
		capabilityId: 1,
		bandId: 2,
		closingDate: "2027-12-31",
		status: "Open",
		description: "Build platforms",
		responsibilities: "Own delivery",
		sharepointUrl: "https://example.com/role",
		statusId: 3,
		numberOfOpenPositions: 2,
		capability: {
			capabilityId: 1,
			capabilityName: "Engineering",
		},
		band: { nameId: 2, bandName: "Band 2" },
		statusRef: { statusId: 3 },
	};

	const createData = {
		jobRoleId: 11,
		roleName: "Platform Engineer",
		location: "Belfast",
		capabilityId: 1,
		bandId: 2,
		closingDate: "2027-12-31",
		status: "Open",
		description: "Build platforms",
		responsibilities: "Own delivery",
		sharepointUrl: "https://example.com/role",
		statusId: 3,
		numberOfOpenPositions: 2,
	};

	beforeEach(() => {
		vi.resetAllMocks();
	});

	it("findAll applies skip and take and returns the total count", async () => {
		prismaMock.jobRole.findMany.mockResolvedValue([jobRoleRecord]);
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
			orderBy: { jobRoleId: "asc" },
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
					"Build platforms",
					"Own delivery",
					"https://example.com/role",
					3,
					2,
				),
			],
			totalItems: 23,
		});
	});

	it("findAll leaves optional filters undefined when no filters are supplied", async () => {
		prismaMock.jobRole.findMany.mockResolvedValue([]);
		prismaMock.jobRole.count.mockResolvedValue(0);

		const result = await new JobRoleDao().findAll(1, 10, {
			roleName: "",
			location: "",
			capability: [],
			band: [],
			status: [],
			closingDate: undefined,
		});

		expect(prismaMock.jobRole.findMany).toHaveBeenCalledWith({
			include: { capability: true, band: true, statusRef: true },
			where: {
				roleName: undefined,
				location: undefined,
				capability: undefined,
				band: undefined,
				status: undefined,
				closingDate: undefined,
			},
			orderBy: { jobRoleId: "asc" },
			skip: 0,
			take: 10,
		});
		expect(result).toEqual({ jobRoles: [], totalItems: 0 });
	});

	it.each([
		["roleName", { roleName: "asc" }],
		["location", { location: "asc" }],
		["capability", { capability: { capabilityName: "asc" } }],
		["band", { band: { bandName: "asc" } }],
		["closingDate", { closingDate: "asc" }],
		["status", { status: "asc" }],
	] as const)("findAll sorts ascending by %s", async (sortBy, orderBy) => {
		prismaMock.jobRole.findMany.mockResolvedValue([]);
		prismaMock.jobRole.count.mockResolvedValue(0);

		await new JobRoleDao().findAll(
			1,
			10,
			{ capability: [], band: [], status: [] },
			{ sortBy, sortOrder: "asc" },
		);

		expect(prismaMock.jobRole.findMany).toHaveBeenCalledWith(
			expect.objectContaining({ orderBy }),
		);
	});

	it("findAll sorts descending when requested", async () => {
		prismaMock.jobRole.findMany.mockResolvedValue([]);
		prismaMock.jobRole.count.mockResolvedValue(0);

		await new JobRoleDao().findAll(
			1,
			10,
			{ capability: [], band: [], status: [] },
			{ sortBy: "capability", sortOrder: "desc" },
		);

		expect(prismaMock.jobRole.findMany).toHaveBeenCalledWith(
			expect.objectContaining({
				orderBy: { capability: { capabilityName: "desc" } },
			}),
		);
	});

	it("findAll falls back to id ordering when no column is requested", async () => {
		prismaMock.jobRole.findMany.mockResolvedValue([]);
		prismaMock.jobRole.count.mockResolvedValue(0);

		await new JobRoleDao().findAll(
			1,
			10,
			{ capability: [], band: [], status: [] },
			{ sortOrder: "desc" },
		);

		expect(prismaMock.jobRole.findMany).toHaveBeenCalledWith(
			expect.objectContaining({ orderBy: { jobRoleId: "asc" } }),
		);
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

	it("findById maps a job role and returns null when it does not exist", async () => {
		prismaMock.jobRole.findUnique
			.mockResolvedValueOnce(jobRoleRecord)
			.mockResolvedValueOnce(null);

		const dao = new JobRoleDao();
		const found = await dao.findById(11);
		const missing = await dao.findById(99);

		expect(found).toEqual(
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
				"Build platforms",
				"Own delivery",
				"https://example.com/role",
				3,
				2,
			),
		);
		expect(missing).toBeNull();
	});

	it("create validates relations, persists data, and maps the result", async () => {
		prismaMock.capability.findUnique.mockResolvedValue({ capabilityId: 1 });
		prismaMock.band.findUnique.mockResolvedValue({ nameId: 2 });
		prismaMock.status.findUnique.mockResolvedValue({ statusId: 3 });
		prismaMock.jobRole.create.mockResolvedValue(jobRoleRecord);

		const result = await new JobRoleDao().create(createData);

		expect(prismaMock.status.findUnique).toHaveBeenCalledWith({
			where: { statusId: 3 },
		});
		expect(prismaMock.jobRole.create).toHaveBeenCalledWith({
			data: createData,
			include: { capability: true, band: true, statusRef: true },
		});
		expect(result.jobRoleId).toBe(11);
	});

	it("create skips status lookup when statusId is omitted", async () => {
		prismaMock.capability.findUnique.mockResolvedValue({ capabilityId: 1 });
		prismaMock.band.findUnique.mockResolvedValue({ nameId: 2 });
		prismaMock.jobRole.create.mockResolvedValue({
			...jobRoleRecord,
			statusId: null,
			statusRef: null,
		});
		const dataWithoutStatus = { ...createData, statusId: undefined };

		await new JobRoleDao().create(dataWithoutStatus);

		expect(prismaMock.status.findUnique).not.toHaveBeenCalled();
	});

	it.each([
		["capability", null, { nameId: 2 }, { statusId: 3 }, "Capability 1"],
		["band", { capabilityId: 1 }, null, { statusId: 3 }, "Band 2"],
		["status", { capabilityId: 1 }, { nameId: 2 }, null, "Status 3"],
	])(
		"create rejects a missing %s relation",
		async (_relation, capability, band, status, message) => {
			prismaMock.capability.findUnique.mockResolvedValue(capability);
			prismaMock.band.findUnique.mockResolvedValue(band);
			prismaMock.status.findUnique.mockResolvedValue(status);

			await expect(new JobRoleDao().create(createData)).rejects.toThrow(
				message,
			);
			expect(prismaMock.jobRole.create).not.toHaveBeenCalled();
		},
	);

	it("update returns null when the job role does not exist", async () => {
		prismaMock.jobRole.findUnique.mockResolvedValue(null);

		const result = await new JobRoleDao().update(99, { roleName: "Updated" });

		expect(result).toBeNull();
		expect(prismaMock.jobRole.update).not.toHaveBeenCalled();
	});

	it("update uses existing relation IDs for omitted fields", async () => {
		prismaMock.jobRole.findUnique.mockResolvedValue(jobRoleRecord);
		prismaMock.capability.findUnique.mockResolvedValue({ capabilityId: 1 });
		prismaMock.band.findUnique.mockResolvedValue({ nameId: 2 });
		prismaMock.status.findUnique.mockResolvedValue({ statusId: 3 });
		prismaMock.jobRole.update.mockResolvedValue({
			...jobRoleRecord,
			roleName: "Updated",
		});

		const result = await new JobRoleDao().update(11, { roleName: "Updated" });

		expect(prismaMock.capability.findUnique).toHaveBeenCalledWith({
			where: { capabilityId: 1 },
		});
		expect(prismaMock.jobRole.update).toHaveBeenCalledWith({
			where: { jobRoleId: 11 },
			data: { roleName: "Updated" },
			include: { capability: true, band: true, statusRef: true },
		});
		expect(result?.roleName).toBe("Updated");
	});

	it("delete returns false for a missing job role and deletes an existing one", async () => {
		prismaMock.jobRole.findUnique
			.mockResolvedValueOnce(null)
			.mockResolvedValueOnce(jobRoleRecord);

		const dao = new JobRoleDao();
		expect(await dao.delete(99)).toBe(false);
		expect(await dao.delete(11)).toBe(true);
		expect(prismaMock.jobRole.delete).toHaveBeenCalledWith({
			where: { jobRoleId: 11 },
		});
	});
});
