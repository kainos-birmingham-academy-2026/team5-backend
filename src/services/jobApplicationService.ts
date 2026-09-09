import { JobApplicationDao } from "../daos/jobApplicationDao";
import { JobRoleDao } from "../daos/jobRoleDao";
import type {
	CreateJobApplicationRequestDto,
	JobApplicationResponseDto,
} from "../dtos/jobApplicationDto";
import { JobApplicationMapper } from "../mappers/jobApplicationMapper";

type ApplyForJobRoleRequestDto = Omit<CreateJobApplicationRequestDto, "status">;

export class JobApplicationService {
	constructor(
		private readonly jobApplicationDao: JobApplicationDao = new JobApplicationDao(),
		private readonly jobRoleDao: JobRoleDao = new JobRoleDao(),
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

		const application = await this.jobApplicationDao.create({
			...applicationData,
			status: "in progress",
		});

		return JobApplicationMapper.toResponse(application);
	}
}
