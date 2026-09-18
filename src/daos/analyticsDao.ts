import type { Prisma } from "@prisma/client";
import type { AnalyticsJobRoleFilters } from "../dtos/analyticsDto";
import prisma from "../prismaClient";

export type AnalyticsDateWindow = {
	gte: Date;
	lt: Date;
};

export type AnalyticsJobRoleRow = {
	jobRoleId: number;
	roleName: string;
	location: string;
	closingDate: string;
	status: string;
	numberOfOpenPositions: number | null;
	capability: { capabilityName: string };
	band: { bandName: string };
	_count: { applications: number };
};

export type AnalyticsStatusCount = {
	status: string;
	count: number;
};

export type AnalyticsScanStatusCount = {
	cvScanStatus: string;
	count: number;
};

const OPEN_STATUS = "Open";

export class AnalyticsDao {
	private jobRoleSelect(window: AnalyticsDateWindow) {
		return {
			jobRoleId: true,
			roleName: true,
			location: true,
			closingDate: true,
			status: true,
			numberOfOpenPositions: true,
			capability: { select: { capabilityName: true } },
			band: { select: { bandName: true } },
			_count: { select: { applications: { where: { createdAt: window } } } },
		} as const;
	}

	buildJobRoleWhere(
		filters: AnalyticsJobRoleFilters,
	): Prisma.JobRoleWhereInput {
		return {
			roleName: filters.roleName
				? { contains: filters.roleName, mode: "insensitive" }
				: undefined,
			location: filters.location
				? { contains: filters.location, mode: "insensitive" }
				: undefined,
			capability: filters.capability.length
				? { capabilityName: { in: filters.capability, mode: "insensitive" } }
				: undefined,
			band: filters.band.length
				? { bandName: { in: filters.band, mode: "insensitive" } }
				: undefined,
			status: filters.status.length
				? { in: filters.status, mode: "insensitive" }
				: undefined,
		};
	}

	async countApplications(window: AnalyticsDateWindow): Promise<number> {
		return prisma.jobApplication.count({ where: { createdAt: window } });
	}

	async countDistinctApplicants(window: AnalyticsDateWindow): Promise<number> {
		const applicants = await prisma.jobApplication.groupBy({
			by: ["applicantId"],
			where: { createdAt: window },
		});

		return applicants.length;
	}

	async countJobRolesByStatus(): Promise<AnalyticsStatusCount[]> {
		const groups = await prisma.jobRole.groupBy({
			by: ["status"],
			_count: { _all: true },
		});

		return groups.map((group) => ({
			status: group.status,
			count: group._count._all,
		}));
	}

	async sumOpenPositions(): Promise<number> {
		const result = await prisma.jobRole.aggregate({
			_sum: { numberOfOpenPositions: true },
			where: { status: OPEN_STATUS },
		});

		return result._sum.numberOfOpenPositions ?? 0;
	}

	async countOpenRolesWithNoApplications(
		window: AnalyticsDateWindow,
	): Promise<number> {
		return prisma.jobRole.count({
			where: {
				status: OPEN_STATUS,
				applications: { none: { createdAt: window } },
			},
		});
	}

	async countOpenRolesClosingBetween(
		fromIsoDate: string,
		toIsoDate: string,
	): Promise<number> {
		return prisma.jobRole.count({
			where: {
				status: OPEN_STATUS,
				closingDate: { gte: fromIsoDate, lte: toIsoDate },
			},
		});
	}

	async countOpenRolesPastClosingDate(todayIsoDate: string): Promise<number> {
		return prisma.jobRole.count({
			where: { status: OPEN_STATUS, closingDate: { lt: todayIsoDate } },
		});
	}

	async findApplicationDates(window: AnalyticsDateWindow): Promise<Date[]> {
		const applications = await prisma.jobApplication.findMany({
			select: { createdAt: true },
			where: { createdAt: window },
		});

		return applications.map((application) => application.createdAt);
	}

	async countApplicationsByCvScanStatus(
		window: AnalyticsDateWindow,
	): Promise<AnalyticsScanStatusCount[]> {
		const groups = await prisma.jobApplication.groupBy({
			by: ["cvScanStatus"],
			_count: { _all: true },
			where: { createdAt: window },
		});

		return groups.map((group) => ({
			cvScanStatus: group.cvScanStatus,
			count: group._count._all,
		}));
	}

	async findJobRolesWithApplicationCounts(
		window: AnalyticsDateWindow,
		where: Prisma.JobRoleWhereInput = {},
	): Promise<AnalyticsJobRoleRow[]> {
		return prisma.jobRole.findMany({
			select: this.jobRoleSelect(window),
			where,
			orderBy: { jobRoleId: "asc" },
		});
	}
}
