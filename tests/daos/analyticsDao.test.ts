import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
	jobRole: {
		findMany: vi.fn(),
		count: vi.fn(),
		groupBy: vi.fn(),
		aggregate: vi.fn(),
	},
	jobApplication: {
		count: vi.fn(),
		groupBy: vi.fn(),
		findMany: vi.fn(),
	},
}));

vi.mock("../../src/prismaClient", () => ({
	default: prismaMock,
}));

import { AnalyticsDao } from "../../src/daos/analyticsDao";

describe("AnalyticsDao", () => {
	const window = {
		gte: new Date("2026-08-18T00:00:00.000Z"),
		// The inclusive `to` of 2026-09-17 becomes an exclusive start of 2026-09-18.
		lt: new Date("2026-09-18T00:00:00.000Z"),
	};

	const dao = new AnalyticsDao();

	beforeEach(() => {
		vi.resetAllMocks();
	});

	it("counts applications inside the inclusive window", async () => {
		prismaMock.jobApplication.count.mockResolvedValue(128);

		await expect(dao.countApplications(window)).resolves.toBe(128);
		expect(prismaMock.jobApplication.count).toHaveBeenCalledWith({
			where: { createdAt: window },
		});
	});

	it("counts distinct applicants by grouping on applicantId", async () => {
		prismaMock.jobApplication.groupBy.mockResolvedValue([
			{ applicantId: "a" },
			{ applicantId: "b" },
		]);

		await expect(dao.countDistinctApplicants(window)).resolves.toBe(2);
		expect(prismaMock.jobApplication.groupBy).toHaveBeenCalledWith({
			by: ["applicantId"],
			where: { createdAt: window },
		});
	});

	it("groups job roles by status", async () => {
		prismaMock.jobRole.groupBy.mockResolvedValue([
			{ status: "Open", _count: { _all: 21 } },
			{ status: "Closed", _count: { _all: 3 } },
		]);

		await expect(dao.countJobRolesByStatus()).resolves.toEqual([
			{ status: "Open", count: 21 },
			{ status: "Closed", count: 3 },
		]);
		expect(prismaMock.jobRole.groupBy).toHaveBeenCalledWith({
			by: ["status"],
			_count: { _all: true },
		});
	});

	it("sums the open positions across open roles", async () => {
		prismaMock.jobRole.aggregate.mockResolvedValue({
			_sum: { numberOfOpenPositions: 47 },
		});

		await expect(dao.sumOpenPositions()).resolves.toBe(47);
		expect(prismaMock.jobRole.aggregate).toHaveBeenCalledWith({
			_sum: { numberOfOpenPositions: true },
			where: { status: "Open" },
		});
	});

	it("returns zero when no open role has a position count", async () => {
		prismaMock.jobRole.aggregate.mockResolvedValue({
			_sum: { numberOfOpenPositions: null },
		});

		await expect(dao.sumOpenPositions()).resolves.toBe(0);
	});

	it("counts open roles with no applications in the window", async () => {
		prismaMock.jobRole.count.mockResolvedValue(5);

		await expect(dao.countOpenRolesWithNoApplications(window)).resolves.toBe(5);
		expect(prismaMock.jobRole.count).toHaveBeenCalledWith({
			where: {
				status: "Open",
				applications: { none: { createdAt: window } },
			},
		});
	});

	it("counts open roles closing inside a lexicographic date range", async () => {
		prismaMock.jobRole.count.mockResolvedValue(3);

		await expect(
			dao.countOpenRolesClosingBetween("2026-09-17", "2026-09-24"),
		).resolves.toBe(3);
		expect(prismaMock.jobRole.count).toHaveBeenCalledWith({
			where: {
				status: "Open",
				closingDate: { gte: "2026-09-17", lte: "2026-09-24" },
			},
		});
	});

	it("counts open roles whose closing date has passed", async () => {
		prismaMock.jobRole.count.mockResolvedValue(1);

		await expect(dao.countOpenRolesPastClosingDate("2026-09-17")).resolves.toBe(
			1,
		);
		expect(prismaMock.jobRole.count).toHaveBeenCalledWith({
			where: { status: "Open", closingDate: { lt: "2026-09-17" } },
		});
	});

	it("selects only the created dates needed for the trend", async () => {
		const createdAt = new Date("2026-09-01T10:00:00.000Z");
		prismaMock.jobApplication.findMany.mockResolvedValue([{ createdAt }]);

		await expect(dao.findApplicationDates(window)).resolves.toEqual([
			createdAt,
		]);
		expect(prismaMock.jobApplication.findMany).toHaveBeenCalledWith({
			select: { createdAt: true },
			where: { createdAt: window },
		});
	});

	it("groups applications by cv scan status", async () => {
		prismaMock.jobApplication.groupBy.mockResolvedValue([
			{ cvScanStatus: "pending", _count: { _all: 128 } },
		]);

		await expect(dao.countApplicationsByCvScanStatus(window)).resolves.toEqual([
			{ cvScanStatus: "pending", count: 128 },
		]);
		expect(prismaMock.jobApplication.groupBy).toHaveBeenCalledWith({
			by: ["cvScanStatus"],
			_count: { _all: true },
			where: { createdAt: window },
		});
	});

	it("includes a relation count filtered by the window when listing roles", async () => {
		prismaMock.jobRole.findMany.mockResolvedValue([]);

		await dao.findJobRolesWithApplicationCounts(window);

		expect(prismaMock.jobRole.findMany).toHaveBeenCalledWith({
			select: {
				jobRoleId: true,
				roleName: true,
				location: true,
				closingDate: true,
				status: true,
				numberOfOpenPositions: true,
				capability: { select: { capabilityName: true } },
				band: { select: { bandName: true } },
				_count: { select: { applications: { where: { createdAt: window } } } },
			},
			where: {},
			orderBy: { jobRoleId: "asc" },
		});
	});

	it("builds a case-insensitive where clause from the validated filters", () => {
		const where = dao.buildJobRoleWhere({
			capability: ["Engineering"],
			band: ["Band 2"],
			status: ["Open"],
			location: "Belfast",
			roleName: "platform",
		});

		expect(where).toEqual({
			roleName: { contains: "platform", mode: "insensitive" },
			location: { contains: "Belfast", mode: "insensitive" },
			capability: {
				capabilityName: { in: ["Engineering"], mode: "insensitive" },
			},
			band: { bandName: { in: ["Band 2"], mode: "insensitive" } },
			status: { in: ["Open"], mode: "insensitive" },
		});
	});

	it("omits absent filters from the where clause", () => {
		const where = dao.buildJobRoleWhere({
			capability: [],
			band: [],
			status: [],
			location: undefined,
			roleName: undefined,
		});

		expect(where).toEqual({
			roleName: undefined,
			location: undefined,
			capability: undefined,
			band: undefined,
			status: undefined,
		});
	});
});
