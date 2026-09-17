import {
	AzureBlobStorageClient,
	type CvBlobStorageClient,
} from "../clients/AzureBlobStorageClient";
import { JobApplicationDao } from "../daos/jobApplicationDao";
import { JobRoleDao } from "../daos/jobRoleDao";
import type {
	ApplyForJobRoleRequestDto,
	CreateJobApplicationRequestDto,
	JobApplicationResponseDto,
} from "../dtos/jobApplicationDto";
import Logger from "../lib/logger";
import { JobApplicationMapper } from "../mappers/jobApplicationMapper";
import type { JobApplication } from "../models/jobApplication";

export class JobApplicationService {
	constructor(
		private readonly jobApplicationDao: JobApplicationDao = new JobApplicationDao(),
		private readonly jobRoleDao: JobRoleDao = new JobRoleDao(),
		private readonly cvBlobStorageClient: CvBlobStorageClient = new AzureBlobStorageClient(),
	) {}

	async apply(
		applicationData: ApplyForJobRoleRequestDto,
	): Promise<JobApplicationResponseDto> {
		const jobRole = await this.jobRoleDao.findById(applicationData.jobRoleId);
		if (!jobRole) {
			throw new Error("Job role not found");
		}

		if (jobRole.status.toLowerCase() !== "open") {
			throw new Error("Job role is not open for applications");
		}

		if (!jobRole.numberOfOpenPositions || jobRole.numberOfOpenPositions <= 0) {
			throw new Error("Job role has no open positions");
		}

		const existingApplication =
			await this.jobApplicationDao.findByApplicantAndJobRole(
				applicationData.applicantId,
				applicationData.jobRoleId,
			);
		if (existingApplication) {
			throw new Error("Applicant has already applied for this job role");
		}

		const cvBlobName = await this.cvBlobStorageClient.uploadCv(
			applicationData.cvData,
			applicationData.applicantId,
			applicationData.cvMimeType,
		);

		let application: JobApplication;
		try {
			const applicationToCreate: CreateJobApplicationRequestDto = {
				applicantId: applicationData.applicantId,
				jobRoleId: applicationData.jobRoleId,
				cvBlobName,
				cvFileName: applicationData.cvFileName,
				cvMimeType: applicationData.cvMimeType,
				cvScanStatus: "pending",
				status: "in progress",
			};
			application = await this.jobApplicationDao.create(applicationToCreate);
		} catch (error) {
			try {
				await this.cvBlobStorageClient.deleteCv(cvBlobName);
			} catch (cleanupError) {
				const message =
					cleanupError instanceof Error
						? cleanupError.message
						: "Unknown cleanup failure";
				Logger.error(`Failed to delete uploaded CV ${cvBlobName}: ${message}`);
			}
			throw error;
		}

		return JobApplicationMapper.toResponse(application);
	}
}
