import { beforeEach, describe, expect, it, vi } from "vitest";
import type { JobApplicationDao } from "../../src/daos/jobApplicationDao";
import type { JobRoleDao } from "../../src/daos/jobRoleDao";
import { JobApplication } from "../../src/models/jobApplication";
import { JobRole } from "../../src/models/jobRole";
import { JobApplicationService } from "../../src/services/jobApplicationService";

describe("JobApplicationService", () => {
	let jobApplicationDaoMock: JobApplicationDao;
	let jobRoleDaoMock: JobRoleDao;
	let service: JobApplicationService;

	const jobRole = new JobRole(
		2,
		"Backend Engineer",
		"Belfast",
		1,
		1,
		"2027-12-31",
		"Open",
		"Engineering",
		"Band 1",
		null,
		null,
		null,
		null,
		1,
	);
	const applicationData = {
		applicantId: "applicant-1",
		jobRoleId: 2,
		cvData: Buffer.from("cv-content"),
		cvFileName: "cv.pdf",
		cvMimeType: "application/pdf",
	};

	beforeEach(() => {
		vi.resetAllMocks();
		jobApplicationDaoMock = {
			findByApplicantAndJobRole: vi.fn(),
			create: vi.fn(),
		} as unknown as JobApplicationDao;
		jobRoleDaoMock = { findById: vi.fn() } as unknown as JobRoleDao;
		service = new JobApplicationService(jobApplicationDaoMock, jobRoleDaoMock);
	});

	it("creates an in-progress application for an open role with vacancies", async () => {
		const createdAt = new Date("2026-09-04T12:00:00.000Z");
		vi.mocked(jobRoleDaoMock.findById).mockResolvedValue(jobRole);
		vi.mocked(
			jobApplicationDaoMock.findByApplicantAndJobRole,
		).mockResolvedValue(null);
		vi.mocked(jobApplicationDaoMock.create).mockResolvedValue(
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

		const result = await service.apply(applicationData);

		expect(jobApplicationDaoMock.create).toHaveBeenCalledWith({
			...applicationData,
			status: "in progress",
		});
		expect(result.status).toBe("in progress");
	});

	it.each([
		["missing", null, "Job role not found"],
		[
			"closed",
			new JobRole(
				2,
				"Backend Engineer",
				"Belfast",
				1,
				1,
				"2027-12-31",
				"Closed",
				"Engineering",
				"Band 1",
				null,
				null,
				null,
				null,
				1,
			),
			"Job role is not open for applications",
		],
		[
			"full",
			new JobRole(
				2,
				"Backend Engineer",
				"Belfast",
				1,
				1,
				"2027-12-31",
				"Open",
				"Engineering",
				"Band 1",
				null,
				null,
				null,
				null,
				0,
			),
			"Job role has no open positions",
		],
	])("rejects a %s job role", async (_scenario, role, errorMessage) => {
		vi.mocked(jobRoleDaoMock.findById).mockResolvedValue(role);

		await expect(service.apply(applicationData)).rejects.toThrow(errorMessage);
		expect(jobApplicationDaoMock.create).not.toHaveBeenCalled();
	});

	it("rejects a duplicate application", async () => {
		vi.mocked(jobRoleDaoMock.findById).mockResolvedValue(jobRole);
		vi.mocked(
			jobApplicationDaoMock.findByApplicantAndJobRole,
		).mockResolvedValue(
			new JobApplication(
				1,
				"applicant-1",
				2,
				"cv.pdf",
				"application/pdf",
				"in progress",
				new Date(),
				new Date(),
			),
		);

		await expect(service.apply(applicationData)).rejects.toThrow(
			"Applicant has already applied for this job role",
		);
		expect(jobApplicationDaoMock.create).not.toHaveBeenCalled();
	});
});
