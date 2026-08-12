import type { Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { JobRoleController } from "../../src/controllers/jobRoleController.ts";
import type { JobRoleService } from "../../src/services/jobRoleService";

describe("JobRoleController", () => {
	let controller: JobRoleController;
	let serviceMock: JobRoleService;

	const createMockReq = (overrides?: Partial<Request>): Request =>
		({
			params: {},
			query: {},
			body: {},
			...overrides,
		}) as Request;

	const createMockRes = (): Response => {
		const res = {} as Response;
		res.status = vi.fn().mockReturnValue(res);
		res.json = vi.fn().mockReturnValue(res);
		res.send = vi.fn().mockReturnValue(res);
		return res;
	};

	beforeEach(() => {
		vi.resetAllMocks();

		serviceMock = {
			findAll: vi.fn(),
			findById: vi.fn(),
			findDetailedById: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
		} as unknown as JobRoleService;

		controller = new JobRoleController(serviceMock);
	});

	it("getAllJobRoles uses defaults and returns a paginated response", async () => {
		const req = createMockReq();
		const res = createMockRes();
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
		vi.mocked(serviceMock.findAll).mockResolvedValue(result);

		await controller.getAllJobRoles(req, res);

		expect(serviceMock.findAll).toHaveBeenCalledWith(1, 10);
		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.json).toHaveBeenCalledWith(result);
	});

	it("getAllJobRoles accepts the maximum page size", async () => {
		const req = createMockReq({ query: { page: "2", pageSize: "100" } });
		const res = createMockRes();
		const result = {
			items: [],
			page: 2,
			pageSize: 100,
			totalItems: 0,
			totalPages: 0,
		};
		vi.mocked(serviceMock.findAll).mockResolvedValue(result);

		await controller.getAllJobRoles(req, res);

		expect(serviceMock.findAll).toHaveBeenCalledWith(2, 100);
		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.json).toHaveBeenCalledWith(result);
	});

	it("getAllJobRoles rejects a page size above the maximum", async () => {
		const req = createMockReq({ query: { pageSize: "101" } });
		const res = createMockRes();

		await controller.getAllJobRoles(req, res);

		expect(serviceMock.findAll).not.toHaveBeenCalled();
		expect(res.status).toHaveBeenCalledWith(400);
		expect(res.json).toHaveBeenCalledWith({
			error: "Invalid pagination parameters",
		});
	});

	it.each(["0", "-1", "1.5", "invalid"])(
		"getAllJobRoles rejects invalid page %s",
		async (page) => {
			const req = createMockReq({ query: { page } });
			const res = createMockRes();

			await controller.getAllJobRoles(req, res);

			expect(serviceMock.findAll).not.toHaveBeenCalled();
			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith({
				error: "Invalid pagination parameters",
			});
		},
	);

	it("getJobRoleById returns 400 for invalid id", async () => {
		const req = createMockReq({ params: { id: "abc" } as Request["params"] });
		const res = createMockRes();

		await controller.getJobRoleById(req, res);

		expect(serviceMock.findDetailedById).not.toHaveBeenCalled();
		expect(res.status).toHaveBeenCalledWith(400);
		expect(res.json).toHaveBeenCalledWith({ error: "Invalid ID provided" });
	});

	it("getJobRoleById returns 404 when not found", async () => {
		const req = createMockReq({ params: { id: "1" } as Request["params"] });
		const res = createMockRes();
		vi.mocked(serviceMock.findDetailedById).mockResolvedValue(null as never);

		await controller.getJobRoleById(req, res);

		expect(serviceMock.findDetailedById).toHaveBeenCalledWith(1);
		expect(res.status).toHaveBeenCalledWith(404);
		expect(res.json).toHaveBeenCalledWith({ error: "Job role not found" });
	});

	it("getJobRoleById returns 200 when found", async () => {
		const req = createMockReq({ params: { id: "1" } as Request["params"] });
		const res = createMockRes();
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
		vi.mocked(serviceMock.findDetailedById).mockResolvedValue(role as never);

		await controller.getJobRoleById(req, res);

		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.json).toHaveBeenCalledWith(role);
	});

	it("createJobRole returns 400 when required fields are missing", async () => {
		const req = createMockReq({ body: { roleName: "Backend Engineer" } });
		const res = createMockRes();

		await controller.createJobRole(req, res);

		expect(serviceMock.create).not.toHaveBeenCalled();
		expect(res.status).toHaveBeenCalledWith(400);
		expect(res.json).toHaveBeenCalledWith({ error: "Missing required fields" });
	});

	it("createJobRole returns 201 when created", async () => {
		const payload = {
			jobRoleId: 1,
			roleName: "Backend Engineer",
			location: "Cairo",
			capabilityId: 1,
			bandId: 2,
			closingDate: "2027-12-31",
			status: "Open",
		};
		const createdResponse = {
			jobRoleId: 1,
			roleName: "Backend Engineer",
			location: "Cairo",
			capabilityName: "Engineering",
			bandName: "Band 2",
			closingDate: "2027-12-31",
			status: "Open",
		};
		const req = createMockReq({ body: payload });
		const res = createMockRes();
		vi.mocked(serviceMock.create).mockResolvedValue(createdResponse as never);

		await controller.createJobRole(req, res);

		expect(serviceMock.create).toHaveBeenCalledWith(payload);
		expect(res.status).toHaveBeenCalledWith(201);
		expect(res.json).toHaveBeenCalledWith(createdResponse);
	});

	it("createJobRole returns 400 when service throws", async () => {
		const payload = {
			jobRoleId: 1,
			roleName: "Backend Engineer",
			location: "Cairo",
			capabilityId: 1,
			bandId: 2,
			closingDate: "2027-12-31",
			status: "Open",
		};
		const req = createMockReq({ body: payload });
		const res = createMockRes();
		vi.mocked(serviceMock.create).mockRejectedValue(
			new Error("Capability 1 does not exist"),
		);

		await controller.createJobRole(req, res);

		expect(res.status).toHaveBeenCalledWith(400);
		expect(res.json).toHaveBeenCalledWith({
			error: "Capability 1 does not exist",
		});
	});

	it("updateJobRole returns 400 for invalid id", async () => {
		const req = createMockReq({
			params: { id: "0" } as Request["params"],
			body: { status: "Closed" },
		});
		const res = createMockRes();

		await controller.updateJobRole(req, res);

		expect(serviceMock.update).not.toHaveBeenCalled();
		expect(res.status).toHaveBeenCalledWith(400);
		expect(res.json).toHaveBeenCalledWith({ error: "Invalid ID provided" });
	});

	it("updateJobRole returns 400 when body is empty", async () => {
		const req = createMockReq({
			params: { id: "1" } as Request["params"],
			body: {},
		});
		const res = createMockRes();

		await controller.updateJobRole(req, res);

		expect(serviceMock.update).not.toHaveBeenCalled();
		expect(res.status).toHaveBeenCalledWith(400);
		expect(res.json).toHaveBeenCalledWith({
			error: "No data provided for update",
		});
	});

	it("updateJobRole returns 404 when target does not exist", async () => {
		const req = createMockReq({
			params: { id: "1" } as Request["params"],
			body: { status: "Closed" },
		});
		const res = createMockRes();
		vi.mocked(serviceMock.update).mockResolvedValue(null as never);

		await controller.updateJobRole(req, res);

		expect(serviceMock.update).toHaveBeenCalledWith(1, { status: "Closed" });
		expect(res.status).toHaveBeenCalledWith(404);
		expect(res.json).toHaveBeenCalledWith({ error: "Job role not found" });
	});

	it("updateJobRole returns 200 with updated data", async () => {
		const updated = {
			jobRoleId: 1,
			roleName: "Backend Engineer",
			location: "Cairo",
			capabilityName: "Engineering",
			bandName: "Band 2",
			closingDate: "2027-12-31",
			status: "Closed",
		};
		const req = createMockReq({
			params: { id: "1" } as Request["params"],
			body: { status: "Closed" },
		});
		const res = createMockRes();
		vi.mocked(serviceMock.update).mockResolvedValue(updated as never);

		await controller.updateJobRole(req, res);

		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.json).toHaveBeenCalledWith(updated);
	});

	it("updateJobRole returns 400 when service throws", async () => {
		const req = createMockReq({
			params: { id: "1" } as Request["params"],
			body: { status: "Closed" },
		});
		const res = createMockRes();
		vi.mocked(serviceMock.update).mockRejectedValue(
			new Error("Band 999 does not exist"),
		);

		await controller.updateJobRole(req, res);

		expect(res.status).toHaveBeenCalledWith(400);
		expect(res.json).toHaveBeenCalledWith({ error: "Band 999 does not exist" });
	});

	it("deleteJobRole returns 400 for invalid id", async () => {
		const req = createMockReq({ params: { id: "-1" } as Request["params"] });
		const res = createMockRes();

		await controller.deleteJobRole(req, res);

		expect(serviceMock.delete).not.toHaveBeenCalled();
		expect(res.status).toHaveBeenCalledWith(400);
		expect(res.json).toHaveBeenCalledWith({ error: "Invalid ID provided" });
	});

	it("deleteJobRole returns 404 when not found", async () => {
		const req = createMockReq({ params: { id: "2" } as Request["params"] });
		const res = createMockRes();
		vi.mocked(serviceMock.delete).mockResolvedValue(false);

		await controller.deleteJobRole(req, res);

		expect(serviceMock.delete).toHaveBeenCalledWith(2);
		expect(res.status).toHaveBeenCalledWith(404);
		expect(res.json).toHaveBeenCalledWith({ error: "Job role not found" });
	});

	it("deleteJobRole returns 204 when deleted", async () => {
		const req = createMockReq({ params: { id: "2" } as Request["params"] });
		const res = createMockRes();
		vi.mocked(serviceMock.delete).mockResolvedValue(true);

		await controller.deleteJobRole(req, res);

		expect(res.status).toHaveBeenCalledWith(204);
		expect(res.send).toHaveBeenCalledOnce();
	});
});
