import { z } from "zod";
import type {
	JobRoleDetailedResponse,
	JobRoleResponse,
} from "../models/jobRoleResponse";

export type JobRoleResponseDto = JobRoleResponse;
export type JobRoleDetailedResponseDto = JobRoleDetailedResponse;

export const CreateJobRoleSchema = z.object({
	jobRoleId: z.number().int().positive(),
	roleName: z.string().nonempty(),
	location: z.string().nonempty(),
	capabilityId: z.number().int().positive(),
	bandId: z.number().int().positive(),
	closingDate: z.string().nonempty(),
	status: z.string().nonempty(),
	description: z.string().trim().min(1).optional(),
	responsibilities: z.string().trim().min(1).optional(),
	sharepointUrl: z.url().optional(),
	statusId: z.number().int().positive().optional(),
	numberOfOpenPositions: z.number().int().nonnegative().optional(),
});

export type CreateJobRoleRequestDto = z.infer<typeof CreateJobRoleSchema>;

export const IdParamSchema = z.object({
	id: z.coerce.number().int().positive(),
});
