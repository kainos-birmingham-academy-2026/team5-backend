import jwt from "jsonwebtoken";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const serviceMock = vi.hoisted(() => ({ apply: vi.fn() }));

vi.mock("../../src/services/jobApplicationService.js", () => ({
	JobApplicationService: vi.fn(function JobApplicationServiceMock() {
		return serviceMock;
	}),
}));

import app from "../../src/app";

describe("Job Application Routes", () => {
	const token = jwt.sign(
		{ userId: "applicant-1", email: "applicant@example.com", roleId: 1 },
		process.env.JWT_SECRET || "your-secret-key-change-this",
	);
	const recruiterToken = jwt.sign(
		{ userId: "recruiter-1", email: "recruiter@example.com", roleId: 2 },
		process.env.JWT_SECRET || "your-secret-key-change-this",
	);

	beforeEach(() => {
		vi.resetAllMocks();
	});

	it("creates an application with an authenticated applicant CV upload", async () => {
		const application = {
			applicationId: 1,
			applicantId: "applicant-1",
			jobRoleId: 2,
			cvFileName: "cv.pdf",
			cvMimeType: "application/pdf",
			status: "in progress",
			createdAt: new Date("2026-09-04T12:00:00.000Z"),
			updatedAt: new Date("2026-09-04T12:00:00.000Z"),
		};
		serviceMock.apply.mockResolvedValue(application);

		const response = await request(app)
			.post("/job-roles/2/applications")
			.set("Authorization", `Bearer ${token}`)
			.attach("cv", Buffer.from("cv-content"), {
				filename: "cv.pdf",
				contentType: "application/pdf",
			});

		expect(response.status).toBe(201);
		expect(response.body).toMatchObject({
			applicationId: 1,
			status: "in progress",
		});
		expect(serviceMock.apply).toHaveBeenCalledWith({
			applicantId: "applicant-1",
			jobRoleId: 2,
			cvData: Buffer.from("cv-content"),
			cvFileName: "cv.pdf",
			cvMimeType: "application/pdf",
		});
	});

	it("rejects an unauthenticated application", async () => {
		const response = await request(app).post("/job-roles/2/applications");

		expect(response.status).toBe(401);
		expect(response.body).toEqual({
			error: "Authentication token is required",
		});
	});

	it("rejects a non-applicant user", async () => {
		const response = await request(app)
			.post("/job-roles/2/applications")
			.set("Authorization", `Bearer ${recruiterToken}`)
			.attach("cv", Buffer.from("cv-content"), {
				filename: "cv.pdf",
				contentType: "application/pdf",
			});

		expect(response.status).toBe(403);
		expect(response.body).toEqual({ error: "Applicant access is required" });
		expect(serviceMock.apply).not.toHaveBeenCalled();
	});

	it("rejects a request without a CV", async () => {
		const response = await request(app)
			.post("/job-roles/2/applications")
			.set("Authorization", `Bearer ${token}`);

		expect(response.status).toBe(400);
		expect(response.body).toEqual({ error: "CV file is required" });
	});

	it("rejects an unsupported CV type", async () => {
		const response = await request(app)
			.post("/job-roles/2/applications")
			.set("Authorization", `Bearer ${token}`)
			.attach("cv", Buffer.from("plain text"), {
				filename: "cv.txt",
				contentType: "text/plain",
			});

		expect(response.status).toBe(400);
		expect(response.body).toEqual({
			error: "CV must be a PDF, DOC, or DOCX file",
		});
	});

	it("rejects a CV larger than 5 MB", async () => {
		const response = await request(app)
			.post("/job-roles/2/applications")
			.set("Authorization", `Bearer ${token}`)
			.attach("cv", Buffer.alloc(5 * 1024 * 1024 + 1), {
				filename: "large-cv.pdf",
				contentType: "application/pdf",
			});

		expect(response.status).toBe(400);
		expect(response.body).toEqual({ error: "CV must not exceed 5 MB" });
		expect(serviceMock.apply).not.toHaveBeenCalled();
	});

	it.each([
		["closed", "Job role is not open for applications"],
		["full", "Job role has no open positions"],
		["duplicate", "Applicant has already applied for this job role"],
	])("returns 400 when the job role is %s", async (_scenario, error) => {
		serviceMock.apply.mockRejectedValue(new Error(error));

		const response = await request(app)
			.post("/job-roles/2/applications")
			.set("Authorization", `Bearer ${token}`)
			.attach("cv", Buffer.from("cv-content"), {
				filename: "cv.pdf",
				contentType: "application/pdf",
			});

		expect(response.status).toBe(400);
		expect(response.body).toEqual({ error });
	});
});
