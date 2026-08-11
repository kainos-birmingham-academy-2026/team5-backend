import { z } from "zod";
import type { JobRoleResponseDto } from "./jobRoleDto";

export const PaginationQuerySchema = z.object({
	page: z.coerce.number().int().positive().default(1),
	pageSize: z.coerce.number().int().positive().max(10).default(10),
});

export type PaginationQueryDto = z.infer<typeof PaginationQuerySchema>;

export type PaginatedJobRolesDto = {
	items: JobRoleResponseDto[];
	page: number;
	pageSize: number;
	totalItems: number;
	totalPages: number;
};
