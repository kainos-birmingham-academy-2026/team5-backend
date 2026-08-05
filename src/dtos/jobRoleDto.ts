import { z } from "zod";
import type { JobRoleResponse } from "../models/jobRoleResponse";

export type JobRoleResponseDto = JobRoleResponse;

export const CreateJobRoleSchema = z.object({
	jobRoleId: z.number().int().positive(),
	roleName: z.string().nonempty(),
	location: z.string().nonempty(),
	capabilityId: z.number().int().positive(),
	bandId: z.number().int().positive(),
	closingDate: z.string().nonempty(),
	status: z.string().nonempty(),
});

export type CreateJobRoleRequestDto = z.infer<typeof CreateJobRoleSchema>;

export const IdParamSchema = z.object({
	id: z.coerce.number().int().positive(),
});
