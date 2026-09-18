import type {
	AnalyticsJobRoleRow,
	AnalyticsScanStatusCount,
	AnalyticsStatusCount,
} from "../daos/analyticsDao";
import { daysBetween, isCalendarDate } from "../lib/dateRange";
import type {
	AnalyticsBreakdownItem,
	AnalyticsDataQualityItem,
	AnalyticsDemandVsSupplyItem,
	AnalyticsRoleSummary,
} from "../models/analyticsResponse";

export const roundToOneDecimal = (value: number): number =>
	Math.round(value * 10) / 10;

const byCountThenLabel = (
	first: { label: string; count: number },
	second: { label: string; count: number },
): number =>
	second.count - first.count || first.label.localeCompare(second.label);

export const AnalyticsMapper = {
	toRoleSummary(
		row: AnalyticsJobRoleRow,
		todayIsoDate: string,
	): AnalyticsRoleSummary {
		const numberOfOpenPositions = row.numberOfOpenPositions ?? 0;
		const applications = row._count.applications;

		return {
			jobRoleId: row.jobRoleId,
			roleName: row.roleName,
			capability: row.capability.capabilityName,
			band: row.band.bandName,
			location: row.location,
			closingDate: row.closingDate,
			numberOfOpenPositions,
			applications,
			applicationsPerPosition:
				numberOfOpenPositions > 0
					? roundToOneDecimal(applications / numberOfOpenPositions)
					: 0,
			// closingDate is a free-text String column, so unparseable values report 0.
			daysUntilClosing: isCalendarDate(row.closingDate)
				? daysBetween(todayIsoDate, row.closingDate)
				: 0,
		};
	},

	toRoleSummaries(
		rows: AnalyticsJobRoleRow[],
		todayIsoDate: string,
	): AnalyticsRoleSummary[] {
		return rows.map((row) => AnalyticsMapper.toRoleSummary(row, todayIsoDate));
	},

	toBreakdown(
		counts: Map<string, number>,
		total: number,
	): AnalyticsBreakdownItem[] {
		return [...counts.entries()]
			.map(([label, count]) => ({
				label,
				count,
				percentage: total > 0 ? roundToOneDecimal((count / total) * 100) : 0,
			}))
			.sort(byCountThenLabel);
	},

	toRoleStatusBreakdown(
		statusCounts: AnalyticsStatusCount[],
	): AnalyticsBreakdownItem[] {
		const total = statusCounts.reduce((sum, entry) => sum + entry.count, 0);

		return statusCounts
			.map((entry) => ({
				label: entry.status,
				count: entry.count,
				percentage:
					total > 0 ? roundToOneDecimal((entry.count / total) * 100) : 0,
			}))
			.sort(byCountThenLabel);
	},

	toDemandVsSupply(
		openPositions: Map<string, number>,
		applications: Map<string, number>,
	): AnalyticsDemandVsSupplyItem[] {
		const labels = new Set([...openPositions.keys(), ...applications.keys()]);

		return [...labels]
			.map((label) => ({
				label,
				openPositions: openPositions.get(label) ?? 0,
				applications: applications.get(label) ?? 0,
			}))
			.sort(
				(first, second) =>
					second.applications - first.applications ||
					first.label.localeCompare(second.label),
			);
	},

	toDataQuality(
		scanStatusCounts: AnalyticsScanStatusCount[],
	): AnalyticsDataQualityItem[] {
		return scanStatusCounts
			.map((entry) => ({ label: entry.cvScanStatus, count: entry.count }))
			.sort(byCountThenLabel);
	},
};
