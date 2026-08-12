import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const serviceMock = vi.hoisted(() => ({
	findAll: vi.fn(),
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

describe("Job Role Routes", () => {
	beforeEach(() => {
		vi.resetAllMocks();
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

		const response = await request(app).get("/job-roles");

		expect(response.status).toBe(200);
		expect(response.body).toEqual(result);
		expect(serviceMock.findAll).toHaveBeenCalledWith(1, 10);
	});

	it("GET /job-roles rejects pageSize above 100", async () => {
		const response = await request(app).get("/job-roles?pageSize=101");

		expect(response.status).toBe(400);
		expect(response.body).toEqual({
			error: "Invalid pagination parameters",
		});
		expect(serviceMock.findAll).not.toHaveBeenCalled();
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

		const response = await request(app).get("/job-roles/1");

		expect(response.status).toBe(200);
		expect(response.body).toEqual(role);
		expect(response.body.status).toBe("Open");
		expect(response.body.numberOfOpenPositions).toBe(3);
	});

	it("GET /job-roles/:id returns 400 for invalid id", async () => {
		const response = await request(app).get("/job-roles/abc");

		expect(response.status).toBe(400);
		expect(response.body).toEqual({ error: "Invalid ID provided" });
		expect(serviceMock.findDetailedById).not.toHaveBeenCalled();
	});

	it("GET /job-roles/:id returns 404 when missing", async () => {
		serviceMock.findDetailedById.mockResolvedValue(null);

		const response = await request(app).get("/job-roles/999");

		expect(response.status).toBe(404);
		expect(response.body).toEqual({ error: "Job role not found" });
	});

	it("POST /job-roles returns 201 with created role", async () => {
		const payload = {
			jobRoleId: 3,
			roleName: "QA Engineer",
			location: "Remote",
			capabilityId: 2,
			bandId: 1,
			closingDate: "2027-10-10",
			status: "Open",
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

		const response = await request(app).post("/job-roles").send(payload);

		expect(response.status).toBe(201);
		expect(response.body).toEqual(created);
	});

	it("POST /job-roles returns 400 when required fields missing", async () => {
		const response = await request(app)
			.post("/job-roles")
			.send({ roleName: "QA Engineer" });

		expect(response.status).toBe(400);
		expect(response.body).toEqual({ error: "Missing required fields" });
		expect(serviceMock.create).not.toHaveBeenCalled();
	});

	it("POST /job-roles returns 400 when service throws", async () => {
		serviceMock.create.mockRejectedValue(
			new Error("Capability 2 does not exist"),
		);

		const response = await request(app).post("/job-roles").send({
			jobRoleId: 3,
			roleName: "QA Engineer",
			location: "Remote",
			capabilityId: 2,
			bandId: 1,
			closingDate: "2027-10-10",
			status: "Open",
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
			.send({ status: "Closed" });

		expect(response.status).toBe(200);
		expect(response.body).toEqual(updated);
	});

	it("PUT /job-roles/:id returns 400 for invalid id", async () => {
		const response = await request(app)
			.put("/job-roles/0")
			.send({ status: "Closed" });

		expect(response.status).toBe(400);
		expect(response.body).toEqual({ error: "Invalid ID provided" });
	});

	it("PUT /job-roles/:id returns 400 for empty body", async () => {
		const response = await request(app).put("/job-roles/1").send({});

		expect(response.status).toBe(400);
		expect(response.body).toEqual({ error: "No data provided for update" });
	});

	it("PUT /job-roles/:id returns 404 when target missing", async () => {
		serviceMock.update.mockResolvedValue(null);

		const response = await request(app)
			.put("/job-roles/999")
			.send({ status: "Closed" });

		expect(response.status).toBe(404);
		expect(response.body).toEqual({ error: "Job role not found" });
	});

	it("PUT /job-roles/:id returns 400 when service throws", async () => {
		serviceMock.update.mockRejectedValue(new Error("Band 99 does not exist"));

		const response = await request(app)
			.put("/job-roles/1")
			.send({ status: "Closed" });

		expect(response.status).toBe(400);
		expect(response.body).toEqual({ error: "Band 99 does not exist" });
	});

	it("DELETE /job-roles/:id returns 204", async () => {
		serviceMock.delete.mockResolvedValue(true);

		const response = await request(app).delete("/job-roles/1");

		expect(response.status).toBe(204);
	});

	it("DELETE /job-roles/:id returns 400 for invalid id", async () => {
		const response = await request(app).delete("/job-roles/-1");

		expect(response.status).toBe(400);
		expect(response.body).toEqual({ error: "Invalid ID provided" });
	});

	it("DELETE /job-roles/:id returns 404 when target missing", async () => {
		serviceMock.delete.mockResolvedValue(false);

		const response = await request(app).delete("/job-roles/999");

		expect(response.status).toBe(404);
		expect(response.body).toEqual({ error: "Job role not found" });
	});
});
