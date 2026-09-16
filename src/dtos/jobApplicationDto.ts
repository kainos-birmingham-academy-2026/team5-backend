import type { JobApplicationResponse } from "../models/jobApplicationResponse";

export interface CreateJobApplicationRequestDto {
	applicantId: string;
	jobRoleId: number;
	cvData: Buffer;
	cvBlobName?: string | null;
	cvFileName: string;
	cvMimeType: string;
	cvScanStatus?: string;
	status: string;
}

export type JobApplicationResponseDto = JobApplicationResponse;
