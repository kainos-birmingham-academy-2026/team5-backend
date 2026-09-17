export interface JobApplicationResponse {
	applicationId: number;
	applicantId: string;
	jobRoleId: number;
	cvBlobName: string | null;
	cvFileName: string;
	cvMimeType: string;
	cvScanStatus: string;
	status: string;
	createdAt: Date;
	updatedAt: Date;
}
