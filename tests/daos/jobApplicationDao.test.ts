import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
	jobApplication: {
		findUnique: vi.fn(),
		create: vi.fn(),
	},
}));

vi.mock("../../src/prismaClient", () => ({
	default: prismaMock,
}));

import { JobApplicationDao } from "../../src/daos/jobApplicationDao";
import { JobApplication } from "../../src/models/jobApplication";

describe("JobApplicationDao", () => {
	const createdAt = new Date("2026-09-04T12:00:00.000Z");
	const applicationRecord = {
		applicationId: 1,
		applicantId: "applicant-1",
		jobRoleId: 2,
		cvData: Buffer.from("cv-content"),
		cvFileName: "cv.pdf",
		cvMimeType: "application/pdf",
		status: "in progress",
		createdAt,
		updatedAt: createdAt,
	};

	beforeEach(() => {
		vi.resetAllMocks();
	});

	it("creates an application with CV data and returns metadata only", async () => {
		prismaMock.jobApplication.create.mockResolvedValue(applicationRecord);
		const applicationData = {
			applicantId: "applicant-1",
			jobRoleId: 2,
			cvData: Buffer.from("cv-content"),
			cvFileName: "cv.pdf",
			cvMimeType: "application/pdf",
			status: "in progress",
		};

		const result = await new JobApplicationDao().create(applicationData);

		expect(prismaMock.jobApplication.create).toHaveBeenCalledWith({
			data: applicationData,
		});
		expect(result).toEqual(
			new JobApplication(
				1,
				"applicant-1",
				2,
				"cv.pdf",
				"application/pdf",
				"in progress",
				createdAt,
				createdAt,
			),
		);
		expect(result).not.toHaveProperty("cvData");
	});

	it("finds an existing application by applicant and job role", async () => {
		prismaMock.jobApplication.findUnique.mockResolvedValue(applicationRecord);

		const result = await new JobApplicationDao().findByApplicantAndJobRole(
			"applicant-1",
			2,
		);

		expect(prismaMock.jobApplication.findUnique).toHaveBeenCalledWith({
			where: {
				applicantId_jobRoleId: { applicantId: "applicant-1", jobRoleId: 2 },
			},
		});
		expect(result?.applicationId).toBe(1);
	});
});