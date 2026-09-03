import { z } from "zod";
import { JobRoleSortQuerySchema } from "./jobRoleSortDto";
import { PaginationQuerySchema } from "./paginationDto";

const optionalTextFilter = z.preprocess(
	(value) => (value === "" ? undefined : value),
	z.string().trim().min(1).optional(),
);

const checkboxFilter = z.preprocess(
	(value) =>
		value === undefined ? [] : Array.isArray(value) ? value : [value],
	z.array(z.string().trim().min(1)),
);

export const JobRoleFilterQuerySchema = PaginationQuerySchema.extend({
	roleName: optionalTextFilter,
	location: optionalTextFilter,
	capability: checkboxFilter,
	band: checkboxFilter,
	status: checkboxFilter,
	closingDate: z.preprocess(
		(value) => (value === "" ? undefined : value),
		z
			.string()
			.regex(/^\d{4}-\d{2}-\d{2}$/)
			.optional(),
	),
}).extend(JobRoleSortQuerySchema.shape);

export type JobRoleFilterQueryDto = z.infer<typeof JobRoleFilterQuerySchema>;

export type JobRoleFilters = Omit<
	JobRoleFilterQueryDto,
	"page" | "pageSize" | "sortBy" | "sortOrder"
>;

export type JobRoleFilterOptionsDto = {
	capabilities: string[];
	bands: string[];
	statuses: string[];
};
