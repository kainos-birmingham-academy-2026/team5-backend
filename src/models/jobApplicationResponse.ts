export interface JobApplicationResponse {
	applicationId: number;
	applicantId: string;
	jobRoleId: number;
	cvFileName: string;
	cvMimeType: string;
	status: string;
	createdAt: Date;
	updatedAt: Date;
}