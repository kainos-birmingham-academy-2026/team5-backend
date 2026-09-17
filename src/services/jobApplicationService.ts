import {
	AzureBlobStorageClient,
	type CvBlobStorageClient,
} from "../clients/AzureBlobStorageClient";
import { JobApplicationDao } from "../daos/jobApplicationDao";
import { JobRoleDao } from "../daos/jobRoleDao";
import type {
	ApplyForJobRoleRequestDto,
	JobApplicationResponseDto,
} from "../dtos/jobApplicationDto";
import { JobApplicationMapper } from "../mappers/jobApplicationMapper";

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

		let application;
		try {
			application = await this.jobApplicationDao.create({
				...applicationData,
				cvBlobName,
				cvScanStatus: "pending",
				status: "in progress",
			});
		} catch (error) {
			await this.cvBlobStorageClient.deleteCv(cvBlobName);
			throw error;
		}

		return JobApplicationMapper.toResponse(application);
	}
}
