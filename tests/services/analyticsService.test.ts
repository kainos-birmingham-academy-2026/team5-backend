import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AnalyticsDao } from "../../src/daos/analyticsDao";
import { AnalyticsCache } from "../../src/lib/analyticsCache";
import {
	AnalyticsRangeError,
	AnalyticsService,
	buildTrend,
	resolveRange,
} from "../../src/services/analyticsService";

const TODAY = "2026-09-17";

const roleRow = (overrides: Record<string, unknown> = {}) => ({
	jobRoleId: 1,
	roleName: "Platform Engineer",
	location: "Belfast",
	closingDate: "2026-09-20",
	status: "Open",
	numberOfOpenPositions: 2,
	capability: { capabilityName: "Engineering" },
	band: { bandName: "Band 2" },
	_count: { applications: 4 },
	...overrides,
});

const createDaoMock = () => ({
	countApplications: vi.fn().mockResolvedValue(0),
	countDistinctApplicants: vi.fn().mockResolvedValue(0),
	countJobRolesByStatus: vi.fn().mockResolvedValue([]),
	sumOpenPositions: vi.fn().mockResolvedValue(0),
	countOpenRolesWithNoApplications: vi.fn().mockResolvedValue(0),
	countOpenRolesClosingBetween: vi.fn().mockResolvedValue(0),
	countOpenRolesPastClosingDate: vi.fn().mockResolvedValue(0),
	findApplicationDates: vi.fn().mockResolvedValue([]),
	countApplicationsByCvScanStatus: vi.fn().mockResolvedValue([]),
	findJobRolesWithApplicationCounts: vi.fn().mockResolvedValue([]),
	buildJobRoleWhere: vi.fn().mockReturnValue({ status: undefined }),
});

const createService = (daoMock: ReturnType<typeof createDaoMock>) =>
	new AnalyticsService(
		daoMock as unknown as AnalyticsDao,
		new AnalyticsCache(60_000),
	);

const tableQuery = (overrides: Record<string, unknown> = {}) => ({
	page: 1,
	pageSize: 10,
	preset: "30d" as const,
	from: undefined,
	to: undefined,
	sortBy: "applications" as const,
	sortOrder: "desc" as const,
	capability: [],
	band: [],
	status: [],
	location: undefined,
	roleName: undefined,
	...overrides,
});

describe("resolveRange", () => {
	it("resolves the 7d preset to an inclusive seven day window ending today", () => {
		expect(resolveRange({ preset: "7d" }, TODAY)).toEqual({
			from: "2026-09-11",
			to: TODAY,
			preset: "7d",
			granularity: "day",
		});
	});

	it("resolves the 30d preset with daily granularity", () => {
		expect(resolveRange({ preset: "30d" }, TODAY)).toEqual({
			from: "2026-08-19",
			to: TODAY,
			preset: "30d",
			granularity: "day",
		});
	});

	it("switches to weekly granularity for the 90d preset", () => {
		expect(resolveRange({ preset: "90d" }, TODAY)).toEqual({
			from: "2026-06-20",
			to: TODAY,
			preset: "90d",
			granularity: "week",
		});
	});

	it("uses the supplied dates for a custom preset", () => {
		expect(
			resolveRange(
				{ preset: "custom", from: "2026-01-01", to: "2026-01-31" },
				TODAY,
			),
		).toEqual({
			from: "2026-01-01",
			to: "2026-01-31",
			preset: "custom",
			granularity: "day",
		});
	});

	it("keeps daily granularity at exactly 31 days", () => {
		expect(
			resolveRange(
				{ preset: "custom", from: "2026-01-01", to: "2026-01-31" },
				TODAY,
			).granularity,
		).toBe("day");
	});

	it("switches to weekly granularity at 32 days", () => {
		expect(
			resolveRange(
				{ preset: "custom", from: "2026-01-01", to: "2026-02-01" },
				TODAY,
			).granularity,
		).toBe("week");
	});

	it("throws when a custom range is missing its dates", () => {
		expect(() => resolveRange({ preset: "custom" }, TODAY)).toThrow(
			AnalyticsRangeError,
		);
	});
});

describe("buildTrend", () => {
	it("zero-fills every day in a daily range", () => {
		const range = {
			from: "2026-09-15",
			to: "2026-09-18",
			preset: "custom",
			granularity: "day" as const,
		};

		expect(
			buildTrend(
				[
					new Date("2026-09-15T09:00:00.000Z"),
					new Date("2026-09-15T23:59:59.000Z"),
					new Date("2026-09-18T00:00:00.000Z"),
				],
				range,
			),
		).toEqual([
			{ bucketStart: "2026-09-15", count: 2 },
			{ bucketStart: "2026-09-16", count: 0 },
			{ bucketStart: "2026-09-17", count: 0 },
			{ bucketStart: "2026-09-18", count: 1 },
		]);
	});

	it("buckets weekly ranges from the Monday of each week", () => {
		const range = {
			from: "2026-09-02",
			to: "2026-09-20",
			preset: "custom",
			granularity: "week" as const,
		};

		expect(
			buildTrend(
				[
					new Date("2026-09-02T12:00:00.000Z"),
					new Date("2026-09-08T12:00:00.000Z"),
					new Date("2026-09-20T12:00:00.000Z"),
				],
				range,
			),
		).toEqual([
			{ bucketStart: "2026-08-31", count: 1 },
			{ bucketStart: "2026-09-07", count: 1 },
			{ bucketStart: "2026-09-14", count: 1 },
		]);
	});

	it("returns a continuous series when no applications exist", () => {
		const range = {
			from: "2026-09-15",
			to: "2026-09-17",
			preset: "custom",
			granularity: "day" as const,
		};

		expect(buildTrend([], range)).toEqual([
			{ bucketStart: "2026-09-15", count: 0 },
			{ bucketStart: "2026-09-16", count: 0 },
			{ bucketStart: "2026-09-17", count: 0 },
		]);
	});
});

describe("AnalyticsService.getOverview", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date(`${TODAY}T12:00:00.000Z`));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("queries the previous period of equal length", async () => {
		const daoMock = createDaoMock();

		await createService(daoMock).getOverview({ preset: "7d" });

		expect(daoMock.countApplications).toHaveBeenNthCalledWith(1, {
			gte: new Date("2026-09-11T00:00:00.000Z"),
			lt: new Date("2026-09-18T00:00:00.000Z"),
		});
		expect(daoMock.countApplications).toHaveBeenNthCalledWith(2, {
			gte: new Date("2026-09-04T00:00:00.000Z"),
			lt: new Date("2026-09-11T00:00:00.000Z"),
		});
	});

	it("looks for roles closing within the next seven days", async () => {
		const daoMock = createDaoMock();

		await createService(daoMock).getOverview({ preset: "7d" });

		expect(daoMock.countOpenRolesClosingBetween).toHaveBeenCalledWith(
			TODAY,
			"2026-09-24",
		);
		expect(daoMock.countOpenRolesPastClosingDate).toHaveBeenCalledWith(TODAY);
	});

	it("computes the percentage change against the previous period", async () => {
		const daoMock = createDaoMock();
		daoMock.countApplications
			.mockResolvedValueOnce(128)
			.mockResolvedValueOnce(96);

		const overview = await createService(daoMock).getOverview({ preset: "7d" });

		expect(overview.kpis.totalApplications).toBe(128);
		expect(overview.kpis.previousPeriodApplications).toBe(96);
		expect(overview.kpis.applicationsChangePercent).toBe(33.3);
	});

	it("reports a full increase when the previous period had no applications", async () => {
		const daoMock = createDaoMock();
		daoMock.countApplications
			.mockResolvedValueOnce(10)
			.mockResolvedValueOnce(0);

		const overview = await createService(daoMock).getOverview({ preset: "7d" });

		expect(overview.kpis.applicationsChangePercent).toBe(100);
	});

	it("reports no change when both periods had no applications", async () => {
		const daoMock = createDaoMock();
		daoMock.countApplications.mockResolvedValueOnce(0).mockResolvedValueOnce(0);

		const overview = await createService(daoMock).getOverview({ preset: "7d" });

		expect(overview.kpis.applicationsChangePercent).toBe(0);
	});

	it("derives the role status KPIs and per-role averages", async () => {
		const daoMock = createDaoMock();
		daoMock.countApplications
			.mockResolvedValueOnce(12)
			.mockResolvedValueOnce(6);
		daoMock.countJobRolesByStatus.mockResolvedValue([
			{ status: "Open", count: 4 },
			{ status: "Closed", count: 2 },
		]);
		daoMock.sumOpenPositions.mockResolvedValue(8);

		const overview = await createService(daoMock).getOverview({ preset: "7d" });

		expect(overview.kpis.totalJobRoles).toBe(6);
		expect(overview.kpis.openRoles).toBe(4);
		expect(overview.kpis.closedRoles).toBe(2);
		expect(overview.kpis.averageApplicationsPerOpenRole).toBe(3);
		expect(overview.kpis.applicationsPerOpenPosition).toBe(1.5);
	});

	it("avoids dividing by zero when there are no open roles or positions", async () => {
		const daoMock = createDaoMock();
		daoMock.countApplications
			.mockResolvedValueOnce(12)
			.mockResolvedValueOnce(6);

		const overview = await createService(daoMock).getOverview({ preset: "7d" });

		expect(overview.kpis.averageApplicationsPerOpenRole).toBe(0);
		expect(overview.kpis.applicationsPerOpenPosition).toBe(0);
	});

	it("builds breakdowns whose counts sum to the total applications", async () => {
		const daoMock = createDaoMock();
		daoMock.countApplications
			.mockResolvedValueOnce(10)
			.mockResolvedValueOnce(0);
		daoMock.findJobRolesWithApplicationCounts.mockResolvedValue([
			roleRow({ _count: { applications: 6 } }),
			roleRow({
				jobRoleId: 2,
				roleName: "Data Analyst",
				location: "London",
				capability: { capabilityName: "Data" },
				band: { bandName: "Band 3" },
				_count: { applications: 4 },
			}),
		]);

		const overview = await createService(daoMock).getOverview({ preset: "7d" });

		expect(overview.breakdowns.byCapability).toEqual([
			{ label: "Engineering", count: 6, percentage: 60 },
			{ label: "Data", count: 4, percentage: 40 },
		]);
		expect(
			overview.breakdowns.byLocation.reduce((sum, row) => sum + row.count, 0),
		).toBe(overview.kpis.totalApplications);
		expect(overview.breakdowns.demandVsSupply).toEqual([
			{ label: "Engineering", openPositions: 2, applications: 6 },
			{ label: "Data", openPositions: 2, applications: 4 },
		]);
	});

	it("excludes roles with no applications from the top roles and ranks cold roles by urgency", async () => {
		const daoMock = createDaoMock();
		daoMock.findJobRolesWithApplicationCounts.mockResolvedValue([
			roleRow({ _count: { applications: 6 } }),
			roleRow({
				jobRoleId: 2,
				roleName: "Data Analyst",
				closingDate: "2026-09-19",
				_count: { applications: 0 },
			}),
			roleRow({
				jobRoleId: 3,
				roleName: "Closed Role",
				status: "Closed",
				_count: { applications: 0 },
			}),
		]);

		const overview = await createService(daoMock).getOverview({ preset: "7d" });

		expect(overview.topRoles.map((role) => role.jobRoleId)).toEqual([1]);
		expect(overview.coldRoles.map((role) => role.jobRoleId)).toEqual([2, 1]);
		expect(overview.coldRoles[0]?.applications).toBe(0);
		expect(overview.coldRoles[0]?.daysUntilClosing).toBe(2);
	});

	it("reports the cv scan status counts and tolerates an unparseable closing date", async () => {
		const daoMock = createDaoMock();
		daoMock.countApplicationsByCvScanStatus.mockResolvedValue([
			{ cvScanStatus: "pending", count: 4 },
			{ cvScanStatus: "clean", count: 9 },
		]);
		daoMock.findJobRolesWithApplicationCounts.mockResolvedValue([
			roleRow({ closingDate: "not-a-date", _count: { applications: 1 } }),
		]);

		const overview = await createService(daoMock).getOverview({ preset: "7d" });

		expect(overview.dataQuality.cvScanStatus).toEqual([
			{ label: "clean", count: 9 },
			{ label: "pending", count: 4 },
		]);
		expect(overview.topRoles[0]?.daysUntilClosing).toBe(0);
	});

	it("serves a repeated request from the cache", async () => {
		const daoMock = createDaoMock();
		const service = createService(daoMock);

		await service.getOverview({ preset: "7d" });
		await service.getOverview({ preset: "7d" });

		expect(daoMock.findJobRolesWithApplicationCounts).toHaveBeenCalledTimes(1);
	});

	it("re-runs the aggregates for a different range", async () => {
		const daoMock = createDaoMock();
		const service = createService(daoMock);

		await service.getOverview({ preset: "7d" });
		await service.getOverview({ preset: "30d" });

		expect(daoMock.findJobRolesWithApplicationCounts).toHaveBeenCalledTimes(2);
	});
});

describe("AnalyticsService.getJobRoles", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date(`${TODAY}T12:00:00.000Z`));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("sorts by applications descending and paginates", async () => {
		const daoMock = createDaoMock();
		daoMock.findJobRolesWithApplicationCounts.mockResolvedValue([
			roleRow({ jobRoleId: 1, _count: { applications: 1 } }),
			roleRow({ jobRoleId: 2, _count: { applications: 9 } }),
			roleRow({ jobRoleId: 3, _count: { applications: 5 } }),
		]);

		const result = await createService(daoMock).getJobRoles(
			tableQuery({ pageSize: 2 }),
		);

		expect(result.items.map((role) => role.jobRoleId)).toEqual([2, 3]);
		expect(result).toMatchObject({
			page: 1,
			pageSize: 2,
			totalItems: 3,
			totalPages: 2,
		});
	});

	it("sorts by role name ascending when requested", async () => {
		const daoMock = createDaoMock();
		daoMock.findJobRolesWithApplicationCounts.mockResolvedValue([
			roleRow({ jobRoleId: 1, roleName: "Zoologist" }),
			roleRow({ jobRoleId: 2, roleName: "Architect" }),
		]);

		const result = await createService(daoMock).getJobRoles(
			tableQuery({ sortBy: "roleName", sortOrder: "asc" }),
		);

		expect(result.items.map((role) => role.roleName)).toEqual([
			"Architect",
			"Zoologist",
		]);
	});

	it("sorts by closing date and by open positions using the allow-list", async () => {
		const daoMock = createDaoMock();
		daoMock.findJobRolesWithApplicationCounts.mockResolvedValue([
			roleRow({
				jobRoleId: 1,
				closingDate: "2026-12-31",
				numberOfOpenPositions: 1,
			}),
			roleRow({
				jobRoleId: 2,
				closingDate: "2026-10-01",
				numberOfOpenPositions: 5,
			}),
		]);
		const service = createService(daoMock);

		const byClosingDate = await service.getJobRoles(
			tableQuery({ sortBy: "closingDate", sortOrder: "asc" }),
		);
		const byPositions = await service.getJobRoles(
			tableQuery({ sortBy: "numberOfOpenPositions", sortOrder: "desc" }),
		);

		expect(byClosingDate.items.map((role) => role.jobRoleId)).toEqual([2, 1]);
		expect(byPositions.items.map((role) => role.jobRoleId)).toEqual([2, 1]);
	});

	it("passes the validated filters to the dao", async () => {
		const daoMock = createDaoMock();
		const query = tableQuery({ capability: ["Engineering"] });

		await createService(daoMock).getJobRoles(query);

		expect(daoMock.buildJobRoleWhere).toHaveBeenCalledWith(query);
		expect(daoMock.findJobRolesWithApplicationCounts).toHaveBeenCalledWith(
			{
				gte: new Date("2026-08-19T00:00:00.000Z"),
				lt: new Date("2026-09-18T00:00:00.000Z"),
			},
			{ status: undefined },
		);
	});

	it("caches identical table requests", async () => {
		const daoMock = createDaoMock();
		const service = createService(daoMock);

		await service.getJobRoles(tableQuery());
		await service.getJobRoles(tableQuery());

		expect(daoMock.findJobRolesWithApplicationCounts).toHaveBeenCalledTimes(1);
	});

	it("does not reuse a cached page for a different page number", async () => {
		const daoMock = createDaoMock();
		const service = createService(daoMock);

		await service.getJobRoles(tableQuery());
		await service.getJobRoles(tableQuery({ page: 2 }));

		expect(daoMock.findJobRolesWithApplicationCounts).toHaveBeenCalledTimes(2);
	});
});
