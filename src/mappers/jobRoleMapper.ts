import type { JobRole } from "../models/jobRole";
import type { JobRoleResponse } from "../models/jobRoleResponse";

export const JobRoleMapper = {
	toResponse(jobRole: JobRole): JobRoleResponse {
		return {
			jobRoleId: jobRole.jobRoleId,
			roleName: jobRole.roleName,
			location: jobRole.location,
			capabilityId: jobRole.capabilityId,
			bandId: jobRole.bandId,
			closingDate: jobRole.closingDate,
			status: jobRole.status,
		};
	},

	toResponses(jobRoles: JobRole[]): JobRoleResponse[] {
		return jobRoles.map((jobRole) => JobRoleMapper.toResponse(jobRole));
	},
};
