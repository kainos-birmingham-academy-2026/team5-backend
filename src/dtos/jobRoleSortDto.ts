import { z } from "zod";

export const JOB_ROLE_SORT_FIELDS = [
	"roleName",
	"location",
	"capability",
	"band",
	"closingDate",
	"status",
] as const;

export const JOB_ROLE_SORT_ORDERS = ["asc", "desc"] as const;

const optionalSortValue = <T extends z.ZodTypeAny>(schema: T) =>
	z.preprocess((value) => (value === "" ? undefined : value), schema);

export const JobRoleSortQuerySchema = z.object({
	sortBy: optionalSortValue(z.enum(JOB_ROLE_SORT_FIELDS).optional()),
	sortOrder: optionalSortValue(z.enum(JOB_ROLE_SORT_ORDERS).default("asc")),
});

export type JobRoleSortField = (typeof JOB_ROLE_SORT_FIELDS)[number];
export type JobRoleSortOrder = (typeof JOB_ROLE_SORT_ORDERS)[number];
export type JobRoleSortQueryDto = z.infer<typeof JobRoleSortQuerySchema>;
export type JobRoleSort = JobRoleSortQueryDto;

export const DEFAULT_JOB_ROLE_SORT: JobRoleSort = { sortOrder: "asc" };
