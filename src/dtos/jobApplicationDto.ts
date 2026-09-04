import type { JobApplicationResponse } from "../models/jobApplicationResponse";

export interface CreateJobApplicationRequestDto {
	applicantId: string;
	jobRoleId: number;
	cvData: Buffer;
	cvFileName: string;
	cvMimeType: string;
	status: string;
}

export type JobApplicationResponseDto = JobApplicationResponse;