import { beforeEach, describe, expect, it, vi } from "vitest";
import type { JobRoleDao } from "../../src/daos/jobRoleDao";
import { JobRole } from "../../src/models/jobRole.ts";
import { JobRoleService } from "../../src/services/jobRoleService";

describe("JobRoleService", () => {
	let daoMock: JobRoleDao;
	let service: JobRoleService;

	const role1 = new JobRole(
		1,
		"Backend Engineer",
		"Cairo",
		1,
		2,
		"2027-12-31",
		"Open",
		"Engineering",
		"Band 2",
	);

	const role2 = new JobRole(
		2,
		"Frontend Engineer",
		"Dubai",
		2,
		3,
		"2027-11-30",
		"Closed",
		"Product",
		"Band 3",
	);

	beforeEach(() => {
		vi.resetAllMocks();
		daoMock = {
			findAll: vi.fn(),
			findById: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
		} as unknown as JobRoleDao;
		service = new JobRoleService(daoMock);
	});

	it("findAll returns mapped response dto array", async () => {
		vi.mocked(daoMock.findAll).mockResolvedValue([role1, role2]);

		const result = await service.findAll();

		expect(daoMock.findAll).toHaveBeenCalledOnce();
		expect(result).toEqual([
			{
				jobRoleId: 1,
				roleName: "Backend Engineer",
				location: "Cairo",
				capabilityName: "Engineering",
				bandName: "Band 2",
				closingDate: "2027-12-31",
				status: "Open",
			},
			{
				jobRoleId: 2,
				roleName: "Frontend Engineer",
				location: "Dubai",
				capabilityName: "Product",
				bandName: "Band 3",
				closingDate: "2027-11-30",
				status: "Closed",
			},
		]);
	});

	it("findById returns mapped dto when found", async () => {
		vi.mocked(daoMock.findById).mockResolvedValue(role1);

		const result = await service.findById(1);

		expect(daoMock.findById).toHaveBeenCalledWith(1);
		expect(result).toEqual({
			jobRoleId: 1,
			roleName: "Backend Engineer",
			location: "Cairo",
			capabilityName: "Engineering",
			bandName: "Band 2",
			closingDate: "2027-12-31",
			status: "Open",
		});
	});

	it("findById returns null when dao returns null", async () => {
		vi.mocked(daoMock.findById).mockResolvedValue(null);

		const result = await service.findById(999);

		expect(daoMock.findById).toHaveBeenCalledWith(999);
		expect(result).toBeNull();
	});

	it("create returns mapped response dto", async () => {
		const payload = {
			jobRoleId: 3,
			roleName: "QA Engineer",
			location: "Remote",
			capabilityId: 2,
			bandId: 1,
			closingDate: "2027-10-10",
			status: "Open",
		};
		const createdRole = new JobRole(
			3,
			"QA Engineer",
			"Remote",
			2,
			1,
			"2027-10-10",
			"Open",
			"Quality",
			"Band 1",
		);
		vi.mocked(daoMock.create).mockResolvedValue(createdRole);

		const result = await service.create(payload);

		expect(daoMock.create).toHaveBeenCalledWith(payload);
		expect(result).toEqual({
			jobRoleId: 3,
			roleName: "QA Engineer",
			location: "Remote",
			capabilityName: "Quality",
			bandName: "Band 1",
			closingDate: "2027-10-10",
			status: "Open",
		});
	});

	it("update throws when payload is empty", async () => {
		await expect(service.update(1, {})).rejects.toThrow(
			"No data provided for update",
		);
		expect(daoMock.update).not.toHaveBeenCalled();
	});

	it("update returns null when dao cannot find record", async () => {
		vi.mocked(daoMock.update).mockResolvedValue(null);

		const result = await service.update(1, { status: "Closed" });

		expect(daoMock.update).toHaveBeenCalledWith(1, { status: "Closed" });
		expect(result).toBeNull();
	});

	it("update returns mapped dto when record is updated", async () => {
		const updatedRole = new JobRole(
			1,
			"Backend Engineer",
			"Cairo",
			1,
			2,
			"2027-12-31",
			"Closed",
			"Engineering",
			"Band 2",
		);
		vi.mocked(daoMock.update).mockResolvedValue(updatedRole);

		const result = await service.update(1, { status: "Closed" });

		expect(daoMock.update).toHaveBeenCalledWith(1, { status: "Closed" });
		expect(result).toEqual({
			jobRoleId: 1,
			roleName: "Backend Engineer",
			location: "Cairo",
			capabilityName: "Engineering",
			bandName: "Band 2",
			closingDate: "2027-12-31",
			status: "Closed",
		});
	});

	it("delete throws when id is invalid", async () => {
		await expect(service.delete(0)).rejects.toThrow(
			"Invalid ID provided for deletion",
		);
		expect(daoMock.delete).not.toHaveBeenCalled();
	});

	it("delete returns false when dao returns false", async () => {
		vi.mocked(daoMock.delete).mockResolvedValue(false);

		const result = await service.delete(55);

		expect(daoMock.delete).toHaveBeenCalledWith(55);
		expect(result).toBe(false);
	});

	it("delete returns true when dao deletes record", async () => {
		vi.mocked(daoMock.delete).mockResolvedValue(true);

		const result = await service.delete(1);

		expect(daoMock.delete).toHaveBeenCalledWith(1);
		expect(result).toBe(true);
	});
});
