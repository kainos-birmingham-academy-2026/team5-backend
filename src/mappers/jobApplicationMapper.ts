import type { JobApplication } from "../models/jobApplication";
import type { JobApplicationResponse } from "../models/jobApplicationResponse";

export const JobApplicationMapper = {
	toResponse(application: JobApplication): JobApplicationResponse {
		return {
			applicationId: application.applicationId,
			applicantId: application.applicantId,
			jobRoleId: application.jobRoleId,
			cvFileName: application.cvFileName,
			cvMimeType: application.cvMimeType,
			status: application.status,
			createdAt: application.createdAt,
			updatedAt: application.updatedAt,
		};
	},
};