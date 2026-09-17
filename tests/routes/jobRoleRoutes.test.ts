import jwt from "jsonwebtoken";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const serviceMock = vi.hoisted(() => ({
	findAll: vi.fn(),
	getFilterOptions: vi.fn(),
	getReferenceOptions: vi.fn(),
	findById: vi.fn(),
	findDetailedById: vi.fn(),
	create: vi.fn(),
	update: vi.fn(),
	delete: vi.fn(),
}));

vi.mock("../../src/services/jobRoleService.js", () => ({
	JobRoleService: vi.fn(function JobRoleServiceMock() {
		return serviceMock;
	}),
}));

import app from "../../src/app";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
	throw new Error("JWT_SECRET environment variable is required for tests");
}

const applicantToken = jwt.sign(
	{
		userId: "user-1",
		email: "john@example.com",
		roleId: 1,
		role: "applicant",
	},
	JWT_SECRET,
);

const adminToken = jwt.sign(
	{
		userId: "admin-1",
		email: "admin@example.com",
		roleId: 3,
		role: "admin",
	},
	JWT_SECRET,
);

const applicantHeader = { Authorization: `Bearer ${applicantToken}` };
const adminHeader = { Authorization: `Bearer ${adminToken}` };

describe("Job Role Routes", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	it("GET /job-roles returns 200 without a token", async () => {
		const result = {
			items: [
				{
					jobRoleId: 1,
					roleName: "Backend Engineer",
					location: "Cairo",
					capabilityName: "Engineering",
					bandName: "Band 2",
					closingDate: "2027-12-31",
					status: "Open",
				},
			],
			page: 1,
			pageSize: 10,
			totalItems: 1,
			totalPages: 1,
		};
		serviceMock.findAll.mockResolvedValue(result);

		const response = await request(app).get("/job-roles");

		expect(response.status).toBe(200);
		expect(response.body).toEqual(result);
		expect(serviceMock.findAll).toHaveBeenCalledWith(1, 10, {
			capability: [],
			band: [],
			status: [],
		});
	});

	it("GET /job-roles ignores an invalid token and still returns listings", async () => {
		const result = {
			items: [],
			page: 1,
			pageSize: 10,
			totalItems: 0,
			totalPages: 0,
		};
		serviceMock.findAll.mockResolvedValue(result);

		const response = await request(app)
			.get("/job-roles")
			.set({ Authorization: "Bearer not-a-valid-token" });

		expect(response.status).toBe(200);
		expect(response.body).toEqual(result);
		expect(serviceMock.findAll).toHaveBeenCalled();
	});

	it("GET /job-roles returns 200 and paginated results", async () => {
		const result = {
			items: [
				{
					jobRoleId: 1,
					roleName: "Backend Engineer",
					location: "Cairo",
					capabilityName: "Engineering",
					bandName: "Band 2",
					closingDate: "2027-12-31",
					status: "Open",
				},
			],
			page: 1,
			pageSize: 10,
			totalItems: 1,
			totalPages: 1,
		};
		serviceMock.findAll.mockResolvedValue(result);

		const response = await request(app).get("/job-roles").set(applicantHeader);

		expect(response.status).toBe(200);
		expect(response.body).toEqual(result);
		expect(serviceMock.findAll).toHaveBeenCalledWith(1, 10, {
			capability: [],
			band: [],
			status: [],
		});
	});

	it("GET /job-roles rejects pageSize above 100", async () => {
		const response = await request(app)
			.get("/job-roles?pageSize=101")
			.set(applicantHeader);

		expect(response.status).toBe(400);
		expect(response.body).toEqual({
			error: "Invalid query parameters",
		});
		expect(serviceMock.findAll).not.toHaveBeenCalled();
	});

	it("GET /job-roles/filter-options returns available checkbox values without a token", async () => {
		const options = {
			capabilities: ["Data", "Engineering"],
			bands: ["Band 1", "Band 2"],
			statuses: ["Closed", "Open"],
		};
		serviceMock.getFilterOptions.mockResolvedValue(options);

		const response = await request(app).get("/job-roles/filter-options");

		expect(response.status).toBe(200);
		expect(response.body).toEqual(options);
	});

	it("GET /job-roles/reference-data returns 403 for an applicant", async () => {
		const response = await request(app)
			.get("/job-roles/reference-data")
			.set(applicantHeader);

		expect(response.status).toBe(403);
		expect(serviceMock.getReferenceOptions).not.toHaveBeenCalled();
	});

	it("GET /job-roles/reference-data returns id-keyed dropdown options for an admin", async () => {
		const referenceData = {
			capabilities: [{ capabilityId: 1, capabilityName: "Engineering" }],
			bands: [{ nameId: 2, bandName: "Band 2" }],
		};
		serviceMock.getReferenceOptions.mockResolvedValue(referenceData);

		const response = await request(app)
			.get("/job-roles/reference-data")
			.set(adminHeader);

		expect(response.status).toBe(200);
		expect(response.body).toEqual(referenceData);
	});

	it("GET /job-roles/:id returns 200 with role", async () => {
		const role = {
			jobRoleId: 1,
			roleName: "Backend Engineer",
			location: "Cairo",
			capabilityName: "Engineering",
			bandName: "Band 2",
			closingDate: "2027-12-31",
			status: "Open",
			description: "Build APIs for core platform",
			responsibilities: "Own backend endpoints and integrations",
			sharepointUrl: "https://sharepoint.local/job-role/backend-engineer",
			statusId: 1,
			numberOfOpenPositions: 3,
			capabilityId: 1,
			bandId: 2,
		};
		serviceMock.findDetailedById.mockResolvedValue(role);

		const response = await request(app)
			.get("/job-roles/1")
			.set(applicantHeader);

		expect(response.status).toBe(200);
		expect(response.body).toEqual(role);
		expect(response.body.status).toBe("Open");
		expect(response.body.numberOfOpenPositions).toBe(3);
	});

	it("GET /job-roles/:id returns 400 for invalid id", async () => {
		const response = await request(app)
			.get("/job-roles/abc")
			.set(applicantHeader);

		expect(response.status).toBe(400);
		expect(response.body).toEqual({ error: "Invalid ID provided" });
		expect(serviceMock.findDetailedById).not.toHaveBeenCalled();
	});

	it("GET /job-roles/:id returns 404 when missing", async () => {
		serviceMock.findDetailedById.mockResolvedValue(null);

		const response = await request(app)
			.get("/job-roles/999")
			.set(applicantHeader);

		expect(response.status).toBe(404);
		expect(response.body).toEqual({ error: "Job role not found" });
	});

	it("POST /job-roles returns 403 for an applicant", async () => {
		const response = await request(app)
			.post("/job-roles")
			.set(applicantHeader)
			.send({
				roleName: "QA Engineer",
				location: "Remote",
				capabilityId: 2,
				bandId: 1,
				closingDate: "2027-10-10",
			});

		expect(response.status).toBe(403);
		expect(response.body).toEqual({ error: "Forbidden" });
		expect(serviceMock.create).not.toHaveBeenCalled();
	});

	it("PUT /job-roles/:id returns 403 for an applicant", async () => {
		const response = await request(app)
			.put("/job-roles/1")
			.set(applicantHeader)
			.send({ status: "Closed" });

		expect(response.status).toBe(403);
		expect(response.body).toEqual({ error: "Forbidden" });
		expect(serviceMock.update).not.toHaveBeenCalled();
	});

	it("DELETE /job-roles/:id returns 403 for an applicant", async () => {
		const response = await request(app)
			.delete("/job-roles/1")
			.set(applicantHeader);

		expect(response.status).toBe(403);
		expect(response.body).toEqual({ error: "Forbidden" });
		expect(serviceMock.delete).not.toHaveBeenCalled();
	});

	it("POST /job-roles returns 201 with created role", async () => {
		const payload = {
			roleName: "QA Engineer",
			location: "Remote",
			capabilityId: 2,
			bandId: 1,
			closingDate: "2027-10-10",
		};
		const created = {
			jobRoleId: 3,
			roleName: "QA Engineer",
			location: "Remote",
			capabilityName: "Quality",
			bandName: "Band 1",
			closingDate: "2027-10-10",
			status: "Open",
		};
		serviceMock.create.mockResolvedValue(created);

		const response = await request(app)
			.post("/job-roles")
			.set(adminHeader)
			.send(payload);

		expect(response.status).toBe(201);
		expect(response.body).toEqual(created);
		expect(serviceMock.create).toHaveBeenCalledWith(payload);
	});

	it("POST /job-roles returns 400 when required fields missing", async () => {
		const response = await request(app)
			.post("/job-roles")
			.set(adminHeader)
			.send({ roleName: "QA Engineer" });

		expect(response.status).toBe(400);
		expect(response.body).toMatchObject({ error: "Invalid job role data" });
		expect(serviceMock.create).not.toHaveBeenCalled();
	});

	it("POST /job-roles returns 400 when service throws", async () => {
		serviceMock.create.mockRejectedValue(
			new Error("Capability 2 does not exist"),
		);

		const response = await request(app)
			.post("/job-roles")
			.set(adminHeader)
			.send({
				roleName: "QA Engineer",
				location: "Remote",
				capabilityId: 2,
				bandId: 1,
				closingDate: "2027-10-10",
			});

		expect(response.status).toBe(400);
		expect(response.body).toEqual({ error: "Capability 2 does not exist" });
	});

	it("PUT /job-roles/:id returns 200 with updated role", async () => {
		const updated = {
			jobRoleId: 1,
			roleName: "Backend Engineer",
			location: "Cairo",
			capabilityName: "Engineering",
			bandName: "Band 2",
			closingDate: "2027-12-31",
			status: "Closed",
		};
		serviceMock.update.mockResolvedValue(updated);

		const response = await request(app)
			.put("/job-roles/1")
			.set(adminHeader)
			.send({ status: "Closed" });

		expect(response.status).toBe(200);
		expect(response.body).toEqual(updated);
	});

	it("PUT /job-roles/:id returns 400 for invalid id", async () => {
		const response = await request(app)
			.put("/job-roles/0")
			.set(adminHeader)
			.send({ status: "Closed" });

		expect(response.status).toBe(400);
		expect(response.body).toEqual({ error: "Invalid ID provided" });
	});

	it("PUT /job-roles/:id returns 400 for empty body", async () => {
		const response = await request(app)
			.put("/job-roles/1")
			.set(adminHeader)
			.send({});

		expect(response.status).toBe(400);
		expect(response.body).toEqual({ error: "No data provided for update" });
	});

	it("PUT /job-roles/:id returns 404 when target missing", async () => {
		serviceMock.update.mockResolvedValue(null);

		const response = await request(app)
			.put("/job-roles/999")
			.set(adminHeader)
			.send({ status: "Closed" });

		expect(response.status).toBe(404);
		expect(response.body).toEqual({ error: "Job role not found" });
	});

	it("PUT /job-roles/:id returns 400 when service throws", async () => {
		serviceMock.update.mockRejectedValue(new Error("Band 99 does not exist"));

		const response = await request(app)
			.put("/job-roles/1")
			.set(adminHeader)
			.send({ status: "Closed" });

		expect(response.status).toBe(400);
		expect(response.body).toEqual({ error: "Band 99 does not exist" });
	});

	it("DELETE /job-roles/:id returns 204", async () => {
		serviceMock.delete.mockResolvedValue(true);

		const response = await request(app).delete("/job-roles/1").set(adminHeader);

		expect(response.status).toBe(204);
	});

	it("DELETE /job-roles/:id returns 400 for invalid id", async () => {
		const response = await request(app)
			.delete("/job-roles/-1")
			.set(adminHeader);

		expect(response.status).toBe(400);
		expect(response.body).toEqual({ error: "Invalid ID provided" });
	});

	it("DELETE /job-roles/:id returns 404 when target missing", async () => {
		serviceMock.delete.mockResolvedValue(false);

		const response = await request(app)
			.delete("/job-roles/999")
			.set(adminHeader);

		expect(response.status).toBe(404);
		expect(response.body).toEqual({ error: "Job role not found" });
	});

	it("DELETE /job-roles/:id returns 409 when the role has existing applications", async () => {
		serviceMock.delete.mockRejectedValue(
			new Error("Cannot delete a job role with existing applications"),
		);

		const response = await request(app).delete("/job-roles/1").set(adminHeader);

		expect(response.status).toBe(409);
		expect(response.body).toEqual({
			error: "Cannot delete a job role with existing applications",
		});
	});
});
