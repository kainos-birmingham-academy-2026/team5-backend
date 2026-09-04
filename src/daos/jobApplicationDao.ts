import type { JobApplication as PrismaJobApplication } from "@prisma/client";
import type { CreateJobApplicationRequestDto } from "../dtos/jobApplicationDto";
import { JobApplication } from "../models/jobApplication";
import prisma from "../prismaClient";

export class JobApplicationDao {
	private toModel(application: PrismaJobApplication): JobApplication {
		return new JobApplication(
			application.applicationId,
			application.applicantId,
			application.jobRoleId,
			application.cvFileName,
			application.cvMimeType,
			application.status,
			application.createdAt,
			application.updatedAt,
		);
	}

	async findByApplicantAndJobRole(
		applicantId: string,
		jobRoleId: number,
	): Promise<JobApplication | null> {
		const application = await prisma.jobApplication.findUnique({
			where: { applicantId_jobRoleId: { applicantId, jobRoleId } },
		});

		return application ? this.toModel(application) : null;
	}

	async create(
		applicationData: CreateJobApplicationRequestDto,
	): Promise<JobApplication> {
		const application = await prisma.jobApplication.create({
			data: applicationData,
		});

		return this.toModel(application);
	}
}