import type { JobRole } from "../models/jobRole";
import type {
	JobRoleDetailedResponse,
	JobRoleResponse,
} from "../models/jobRoleResponse";

export const JobRoleMapper = {
	toResponse(jobRole: JobRole): JobRoleResponse {
		return {
			jobRoleId: jobRole.jobRoleId,
			roleName: jobRole.roleName,
			location: jobRole.location,
			capabilityName: jobRole.capabilityName,
			bandName: jobRole.bandName,
			closingDate: jobRole.closingDate,
			status: jobRole.status,
		};
	},

	toResponses(jobRoles: JobRole[]): JobRoleResponse[] {
		return jobRoles.map((jobRole) => JobRoleMapper.toResponse(jobRole));
	},

	toDetailedResponse(jobRole: JobRole): JobRoleDetailedResponse {
		return {
			jobRoleId: jobRole.jobRoleId,
			roleName: jobRole.roleName,
			location: jobRole.location,
			capabilityName: jobRole.capabilityName,
			bandName: jobRole.bandName,
			closingDate: jobRole.closingDate,
			status: jobRole.status,
			capabilityId: jobRole.capabilityId,
			bandId: jobRole.bandId,
			description: jobRole.description,
			responsibilities: jobRole.responsibilities,
			sharepointUrl: jobRole.sharepointUrl,
			statusId: jobRole.statusId,
			numberOfOpenPositions: jobRole.numberOfOpenPositions,
			canApply:
				jobRole.status.toLowerCase() === "open" &&
				(jobRole.numberOfOpenPositions ?? 0) > 0,
		};
	},
};
