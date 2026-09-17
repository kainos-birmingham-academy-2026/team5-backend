import type { JobApplicationResponse } from "../models/jobApplicationResponse";

export interface CreateJobApplicationRequestDto {
	applicantId: string;
	jobRoleId: number;
	cvBlobName: string;
	cvFileName: string;
	cvMimeType: string;
	cvScanStatus: string;
	status: string;
}

export interface ApplyForJobRoleRequestDto {
	applicantId: string;
	jobRoleId: number;
	cvData: Buffer;
	cvFileName: string;
	cvMimeType: string;
}

export type JobApplicationResponseDto = JobApplicationResponse;
