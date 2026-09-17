import { z } from "zod";
import { inclusiveDaySpan, isCalendarDate } from "../lib/dateRange";
import { PaginationQuerySchema } from "./paginationDto";

export const MAX_RANGE_DAYS = 366;

const optionalDateFilter = z.preprocess(
	(value) => (value === "" ? undefined : value),
	z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/, "Date must use the YYYY-MM-DD format")
		.refine(isCalendarDate, "Date must be a real calendar date")
		.optional(),
);

const optionalTextFilter = z.preprocess(
	(value) => (value === "" ? undefined : value),
	z.string().trim().min(1).optional(),
);

const checkboxFilter = z.preprocess(
	(value) =>
		value === undefined ? [] : Array.isArray(value) ? value : [value],
	z.array(z.string().trim().min(1)),
);

const rangeShape = {
	preset: z.enum(["7d", "30d", "90d", "custom"]).default("30d"),
	from: optionalDateFilter,
	to: optionalDateFilter,
};

type RangeInput = { preset: string; from?: string; to?: string };

const refineRange = (value: RangeInput, ctx: z.RefinementCtx): void => {
	if (value.preset === "custom" && (!value.from || !value.to)) {
		ctx.addIssue({
			code: "custom",
			path: ["preset"],
			message: "A custom preset requires both from and to dates",
		});
		return;
	}

	if (!value.from || !value.to) {
		return;
	}

	if (value.from > value.to) {
		ctx.addIssue({
			code: "custom",
			path: ["from"],
			message: "from must not be later than to",
		});
		return;
	}

	if (inclusiveDaySpan(value.from, value.to) > MAX_RANGE_DAYS) {
		ctx.addIssue({
			code: "custom",
			path: ["to"],
			message: `The range must not exceed ${MAX_RANGE_DAYS} days`,
		});
	}
};

export const AnalyticsRangeQuerySchema = z
	.object(rangeShape)
	.superRefine(refineRange);

export const AnalyticsJobRolesQuerySchema = PaginationQuerySchema.extend({
	...rangeShape,
	sortBy: z
		.enum(["applications", "roleName", "closingDate", "numberOfOpenPositions"])
		.default("applications"),
	sortOrder: z.enum(["asc", "desc"]).default("desc"),
	capability: checkboxFilter,
	band: checkboxFilter,
	status: checkboxFilter,
	location: optionalTextFilter,
	roleName: optionalTextFilter,
}).superRefine(refineRange);

export type AnalyticsRangeQueryDto = z.infer<typeof AnalyticsRangeQuerySchema>;

export type AnalyticsJobRolesQueryDto = z.infer<
	typeof AnalyticsJobRolesQuerySchema
>;

export type AnalyticsSortBy = AnalyticsJobRolesQueryDto["sortBy"];

export type AnalyticsSortOrder = AnalyticsJobRolesQueryDto["sortOrder"];

export type AnalyticsJobRoleFilters = Pick<
	AnalyticsJobRolesQueryDto,
	"capability" | "band" | "status" | "location" | "roleName"
>;
