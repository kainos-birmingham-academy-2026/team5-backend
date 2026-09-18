import { AnalyticsDao, type AnalyticsJobRoleRow } from "../daos/analyticsDao";
import type {
	AnalyticsJobRolesQueryDto,
	AnalyticsRangeQueryDto,
	AnalyticsSortBy,
	AnalyticsSortOrder,
} from "../dtos/analyticsDto";
import { AnalyticsCache, buildCacheKey } from "../lib/analyticsCache";
import {
	addDays,
	inclusiveDaySpan,
	startOfIsoWeek,
	toDateWindow,
	todayIsoDate,
	toIsoDate,
} from "../lib/dateRange";
import { AnalyticsMapper, roundToOneDecimal } from "../mappers/analyticsMapper";
import type {
	AnalyticsOverviewResponse,
	AnalyticsRange,
	AnalyticsRoleSummary,
	AnalyticsTrendPoint,
	PaginatedAnalyticsJobRoles,
} from "../models/analyticsResponse";

export class AnalyticsRangeError extends Error {}

const PRESET_DAYS = { "7d": 7, "30d": 30, "90d": 90 } as const;
const DAILY_GRANULARITY_MAX_DAYS = 31;
const RANKING_SIZE = 10;
const CLOSING_SOON_DAYS = 7;

/** Hard-coded allow-list; a sort field name from the query string never reaches Prisma. */
const ROLE_COMPARATORS: Record<
	AnalyticsSortBy,
	(first: AnalyticsRoleSummary, second: AnalyticsRoleSummary) => number
> = {
	applications: (first, second) => first.applications - second.applications,
	roleName: (first, second) => first.roleName.localeCompare(second.roleName),
	closingDate: (first, second) =>
		first.closingDate.localeCompare(second.closingDate),
	numberOfOpenPositions: (first, second) =>
		first.numberOfOpenPositions - second.numberOfOpenPositions,
};

const isOpen = (status: string): boolean => status.toLowerCase() === "open";

const accumulate = (
	target: Map<string, number>,
	label: string,
	value: number,
): void => {
	target.set(label, (target.get(label) ?? 0) + value);
};

const changePercent = (current: number, previous: number): number => {
	if (previous === 0) {
		return current === 0 ? 0 : 100;
	}

	return roundToOneDecimal(((current - previous) / previous) * 100);
};

const buildRange = (
	from: string,
	to: string,
	preset: string,
): AnalyticsRange => ({
	from,
	to,
	preset,
	granularity:
		inclusiveDaySpan(from, to) <= DAILY_GRANULARITY_MAX_DAYS ? "day" : "week",
});

export const resolveRange = (
	query: AnalyticsRangeQueryDto,
	today: string = todayIsoDate(),
): AnalyticsRange => {
	if (query.preset === "custom") {
		if (!query.from || !query.to) {
			throw new AnalyticsRangeError(
				"A custom range requires both from and to dates",
			);
		}

		return buildRange(query.from, query.to, "custom");
	}

	const days = PRESET_DAYS[query.preset];
	return buildRange(addDays(today, -(days - 1)), today, query.preset);
};

const previousPeriod = (
	range: AnalyticsRange,
): { from: string; to: string } => {
	const span = inclusiveDaySpan(range.from, range.to);
	return { from: addDays(range.from, -span), to: addDays(range.from, -1) };
};

const trendBuckets = (range: AnalyticsRange): string[] => {
	const buckets: string[] = [];

	if (range.granularity === "day") {
		for (let day = range.from; day <= range.to; day = addDays(day, 1)) {
			buckets.push(day);
		}
		return buckets;
	}

	const lastBucket = startOfIsoWeek(range.to);
	for (
		let week = startOfIsoWeek(range.from);
		week <= lastBucket;
		week = addDays(week, 7)
	) {
		buckets.push(week);
	}
	return buckets;
};

export const buildTrend = (
	createdDates: Date[],
	range: AnalyticsRange,
): AnalyticsTrendPoint[] => {
	const counts = new Map<string, number>(
		trendBuckets(range).map((bucket) => [bucket, 0]),
	);

	for (const createdDate of createdDates) {
		const day = toIsoDate(createdDate);
		const bucket = range.granularity === "day" ? day : startOfIsoWeek(day);
		if (counts.has(bucket)) {
			counts.set(bucket, (counts.get(bucket) ?? 0) + 1);
		}
	}

	return [...counts.entries()].map(([bucketStart, count]) => ({
		bucketStart,
		count,
	}));
};

export class AnalyticsService {
	constructor(
		private readonly analyticsDao: AnalyticsDao = new AnalyticsDao(),
		private readonly cache: AnalyticsCache = new AnalyticsCache(),
	) {}

	async getOverview(
		query: AnalyticsRangeQueryDto,
	): Promise<AnalyticsOverviewResponse> {
		const range = resolveRange(query);
		const key = buildCacheKey("analytics.overview", {
			preset: range.preset,
			from: range.from,
			to: range.to,
		});

		return this.cache.readThrough(key, () => this.loadOverview(range));
	}

	async getJobRoles(
		query: AnalyticsJobRolesQueryDto,
	): Promise<PaginatedAnalyticsJobRoles> {
		const range = resolveRange(query);
		const key = buildCacheKey("analytics.jobRoles", {
			preset: range.preset,
			from: range.from,
			to: range.to,
			page: query.page,
			pageSize: query.pageSize,
			sortBy: query.sortBy,
			sortOrder: query.sortOrder,
			capability: query.capability,
			band: query.band,
			status: query.status,
			location: query.location ?? null,
			roleName: query.roleName ?? null,
		});

		return this.cache.readThrough(key, () => this.loadJobRoles(range, query));
	}

	private async loadOverview(
		range: AnalyticsRange,
	): Promise<AnalyticsOverviewResponse> {
		const today = todayIsoDate();
		const window = toDateWindow(range.from, range.to);
		const previous = previousPeriod(range);
		const previousWindow = toDateWindow(previous.from, previous.to);

		const [
			totalApplications,
			previousPeriodApplications,
			uniqueApplicants,
			statusCounts,
			totalOpenPositions,
			rolesWithNoApplications,
			rolesClosingWithin7Days,
			rolesPastClosingDateStillOpen,
			applicationDates,
			scanStatusCounts,
			roleRows,
		] = await Promise.all([
			this.analyticsDao.countApplications(window),
			this.analyticsDao.countApplications(previousWindow),
			this.analyticsDao.countDistinctApplicants(window),
			this.analyticsDao.countJobRolesByStatus(),
			this.analyticsDao.sumOpenPositions(),
			this.analyticsDao.countOpenRolesWithNoApplications(window),
			this.analyticsDao.countOpenRolesClosingBetween(
				today,
				addDays(today, CLOSING_SOON_DAYS),
			),
			this.analyticsDao.countOpenRolesPastClosingDate(today),
			this.analyticsDao.findApplicationDates(window),
			this.analyticsDao.countApplicationsByCvScanStatus(window),
			this.analyticsDao.findJobRolesWithApplicationCounts(window),
		]);

		const totalJobRoles = statusCounts.reduce(
			(sum, entry) => sum + entry.count,
			0,
		);
		const openRoles = statusCounts
			.filter((entry) => isOpen(entry.status))
			.reduce((sum, entry) => sum + entry.count, 0);
		const closedRoles = statusCounts
			.filter((entry) => entry.status.toLowerCase() === "closed")
			.reduce((sum, entry) => sum + entry.count, 0);

		return {
			range,
			kpis: {
				totalApplications,
				previousPeriodApplications,
				applicationsChangePercent: changePercent(
					totalApplications,
					previousPeriodApplications,
				),
				totalJobRoles,
				openRoles,
				closedRoles,
				totalOpenPositions,
				uniqueApplicants,
				averageApplicationsPerOpenRole:
					openRoles > 0 ? roundToOneDecimal(totalApplications / openRoles) : 0,
				applicationsPerOpenPosition:
					totalOpenPositions > 0
						? roundToOneDecimal(totalApplications / totalOpenPositions)
						: 0,
				rolesWithNoApplications,
				rolesClosingWithin7Days,
				rolesPastClosingDateStillOpen,
			},
			trend: buildTrend(applicationDates, range),
			breakdowns: {
				...this.buildBreakdowns(roleRows, totalApplications),
				byRoleStatus: AnalyticsMapper.toRoleStatusBreakdown(statusCounts),
			},
			topRoles: this.buildTopRoles(roleRows, today),
			coldRoles: this.buildColdRoles(roleRows, today),
			dataQuality: {
				cvScanStatus: AnalyticsMapper.toDataQuality(scanStatusCounts),
			},
		};
	}

	private buildBreakdowns(roleRows: AnalyticsJobRoleRow[], total: number) {
		const byCapability = new Map<string, number>();
		const byBand = new Map<string, number>();
		const byLocation = new Map<string, number>();
		const openPositionsByCapability = new Map<string, number>();

		for (const row of roleRows) {
			const capability = row.capability.capabilityName;
			accumulate(byCapability, capability, row._count.applications);
			accumulate(byBand, row.band.bandName, row._count.applications);
			accumulate(byLocation, row.location, row._count.applications);

			if (isOpen(row.status)) {
				accumulate(
					openPositionsByCapability,
					capability,
					row.numberOfOpenPositions ?? 0,
				);
			}
		}

		return {
			byCapability: AnalyticsMapper.toBreakdown(byCapability, total),
			byBand: AnalyticsMapper.toBreakdown(byBand, total),
			byLocation: AnalyticsMapper.toBreakdown(byLocation, total),
			demandVsSupply: AnalyticsMapper.toDemandVsSupply(
				openPositionsByCapability,
				byCapability,
			),
		};
	}

	private buildTopRoles(
		roleRows: AnalyticsJobRoleRow[],
		today: string,
	): AnalyticsRoleSummary[] {
		return AnalyticsMapper.toRoleSummaries(roleRows, today)
			.filter((role) => role.applications > 0)
			.sort(
				(first, second) =>
					second.applications - first.applications ||
					first.roleName.localeCompare(second.roleName),
			)
			.slice(0, RANKING_SIZE);
	}

	private buildColdRoles(
		roleRows: AnalyticsJobRoleRow[],
		today: string,
	): AnalyticsRoleSummary[] {
		return AnalyticsMapper.toRoleSummaries(
			roleRows.filter((row) => isOpen(row.status)),
			today,
		)
			.sort(
				(first, second) =>
					first.applications - second.applications ||
					first.daysUntilClosing - second.daysUntilClosing ||
					first.roleName.localeCompare(second.roleName),
			)
			.slice(0, RANKING_SIZE);
	}

	private async loadJobRoles(
		range: AnalyticsRange,
		query: AnalyticsJobRolesQueryDto,
	): Promise<PaginatedAnalyticsJobRoles> {
		const today = todayIsoDate();
		const window = toDateWindow(range.from, range.to);
		const where = this.analyticsDao.buildJobRoleWhere(query);
		const roleRows = await this.analyticsDao.findJobRolesWithApplicationCounts(
			window,
			where,
		);

		// Sorting happens in memory because the count is filtered by the selected range,
		// which Prisma cannot order by.
		const items = AnalyticsMapper.toRoleSummaries(roleRows, today).sort(
			this.buildComparator(query.sortBy, query.sortOrder),
		);
		const skip = (query.page - 1) * query.pageSize;

		return {
			items: items.slice(skip, skip + query.pageSize),
			page: query.page,
			pageSize: query.pageSize,
			totalItems: items.length,
			totalPages: Math.ceil(items.length / query.pageSize),
		};
	}

	private buildComparator(
		sortBy: AnalyticsSortBy,
		sortOrder: AnalyticsSortOrder,
	) {
		const compare = ROLE_COMPARATORS[sortBy];
		const direction = sortOrder === "asc" ? 1 : -1;

		return (
			first: AnalyticsRoleSummary,
			second: AnalyticsRoleSummary,
		): number =>
			compare(first, second) * direction || first.jobRoleId - second.jobRoleId;
	}
}
