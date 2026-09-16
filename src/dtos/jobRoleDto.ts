import { z } from "zod";
import type {
	JobRoleDetailedResponse,
	JobRoleResponse,
} from "../models/jobRoleResponse";

export type JobRoleResponseDto = JobRoleResponse;
export type JobRoleDetailedResponseDto = JobRoleDetailedResponse;

// jobRoleId is server-generated and status always starts "Open" (US012), so neither is accepted from the client on create.
export const CreateJobRoleSchema = z.object({
	roleName: z.string().trim().nonempty(),
	location: z.string().trim().nonempty(),
	capabilityId: z.number().int().positive(),
	bandId: z.number().int().positive(),
	closingDate: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/, "closingDate must be in YYYY-MM-DD format"),
	description: z.string().trim().min(1).optional(),
	responsibilities: z.string().trim().min(1).optional(),
	sharepointUrl: z.url().optional(),
	statusId: z.number().int().positive().optional(),
	numberOfOpenPositions: z.number().int().nonnegative().optional(),
});

export type CreateJobRoleRequestDto = z.infer<typeof CreateJobRoleSchema>;

// Persistence-only shape: the service adds `status` before handing data to the DAO.
export type JobRoleCreateData = CreateJobRoleRequestDto & { status: string };

// Edits (US015) may change status, unlike creation.
export const UpdateJobRoleSchema = CreateJobRoleSchema.partial().extend({
	status: z.string().trim().nonempty().optional(),
});

export type UpdateJobRoleRequestDto = z.infer<typeof UpdateJobRoleSchema>;

export const IdParamSchema = z.object({
	id: z.coerce.number().int().positive(),
});
