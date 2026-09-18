export interface AnalyticsRange {
	from: string;
	to: string;
	preset: string;
	granularity: "day" | "week";
}

export interface AnalyticsKpis {
	totalApplications: number;
	previousPeriodApplications: number;
	applicationsChangePercent: number;
	totalJobRoles: number;
	openRoles: number;
	closedRoles: number;
	totalOpenPositions: number;
	uniqueApplicants: number;
	averageApplicationsPerOpenRole: number;
	applicationsPerOpenPosition: number;
	rolesWithNoApplications: number;
	rolesClosingWithin7Days: number;
	rolesPastClosingDateStillOpen: number;
}

export interface AnalyticsTrendPoint {
	bucketStart: string;
	count: number;
}

export interface AnalyticsBreakdownItem {
	label: string;
	count: number;
	percentage: number;
}

export interface AnalyticsDemandVsSupplyItem {
	label: string;
	openPositions: number;
	applications: number;
}

export interface AnalyticsBreakdowns {
	byCapability: AnalyticsBreakdownItem[];
	byBand: AnalyticsBreakdownItem[];
	byLocation: AnalyticsBreakdownItem[];
	byRoleStatus: AnalyticsBreakdownItem[];
	demandVsSupply: AnalyticsDemandVsSupplyItem[];
}

export interface AnalyticsRoleSummary {
	jobRoleId: number;
	roleName: string;
	capability: string;
	band: string;
	location: string;
	closingDate: string;
	numberOfOpenPositions: number;
	applications: number;
	applicationsPerPosition: number;
	daysUntilClosing: number;
}

export interface AnalyticsDataQualityItem {
	label: string;
	count: number;
}

export interface AnalyticsDataQuality {
	cvScanStatus: AnalyticsDataQualityItem[];
}

export interface AnalyticsOverviewResponse {
	range: AnalyticsRange;
	kpis: AnalyticsKpis;
	trend: AnalyticsTrendPoint[];
	breakdowns: AnalyticsBreakdowns;
	topRoles: AnalyticsRoleSummary[];
	coldRoles: AnalyticsRoleSummary[];
	dataQuality: AnalyticsDataQuality;
}

export interface PaginatedAnalyticsJobRoles {
	items: AnalyticsRoleSummary[];
	page: number;
	pageSize: number;
	totalItems: number;
	totalPages: number;
}
