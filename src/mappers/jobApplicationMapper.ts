import type { JobApplication } from "../models/jobApplication";
import type { JobApplicationResponse } from "../models/jobApplicationResponse";

export const JobApplicationMapper = {
	toResponse(application: JobApplication): JobApplicationResponse {
		return {
			applicationId: application.applicationId,
			applicantId: application.applicantId,
			jobRoleId: application.jobRoleId,
			cvBlobName: application.cvBlobName,
			cvFileName: application.cvFileName,
			cvMimeType: application.cvMimeType,
			cvScanStatus: application.cvScanStatus,
			status: application.status,
			createdAt: application.createdAt,
			updatedAt: application.updatedAt,
		};
	},
};
