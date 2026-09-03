import type { Request, Response } from "express";
import type { CreateJobRoleRequestDto } from "../dtos/jobRoleDto";
import { JobRoleFilterQuerySchema } from "../dtos/jobRoleFilterDto";
import type { JobRoleService } from "../services/jobRoleService.js";

export class JobRoleController {
	constructor(private readonly jobRoleService: JobRoleService) {}

	async getJobRoleById(req: Request, res: Response): Promise<void> {
		const id = Number(req.params.id);

		if (Number.isNaN(id) || id <= 0) {
			res.status(400).json({ error: "Invalid ID provided" });
			return;
		}

		const jobRole = await this.jobRoleService.findDetailedById(id);
		if (!jobRole) {
			res.status(404).json({ error: "Job role not found" });
			return;
		}

		res.status(200).json(jobRole);
	}

	async createJobRole(req: Request, res: Response): Promise<void> {
		const jobRoleData: CreateJobRoleRequestDto =
			req.body as CreateJobRoleRequestDto;

		if (
			!jobRoleData.roleName ||
			!jobRoleData.location ||
			!jobRoleData.capabilityId ||
			!jobRoleData.bandId ||
			!jobRoleData.closingDate ||
			!jobRoleData.status
		) {
			res.status(400).json({ error: "Missing required fields" });
			return;
		}

		try {
			const createdJobRole = await this.jobRoleService.create(jobRoleData);
			res.status(201).json(createdJobRole);
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Unable to create job role";
			res.status(400).json({ error: message });
		}
	}

	async updateJobRole(req: Request, res: Response): Promise<void> {
		const id = Number(req.params.id);

		if (Number.isNaN(id) || id <= 0) {
			res.status(400).json({ error: "Invalid ID provided" });
			return;
		}

		const jobRoleData: Partial<CreateJobRoleRequestDto> = req.body;
		if (!jobRoleData || Object.keys(jobRoleData).length === 0) {
			res.status(400).json({ error: "No data provided for update" });
			return;
		}

		try {
			const updatedJobRole = await this.jobRoleService.update(id, jobRoleData);
			if (!updatedJobRole) {
				res.status(404).json({ error: "Job role not found" });
				return;
			}

			res.status(200).json(updatedJobRole);
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Unable to update job role";
			res.status(400).json({ error: message });
		}
	}

	async deleteJobRole(req: Request, res: Response): Promise<void> {
		const id = Number(req.params.id);

		if (Number.isNaN(id) || id <= 0) {
			res.status(400).json({ error: "Invalid ID provided" });
			return;
		}

		const deletedJobRole = await this.jobRoleService.delete(id);
		if (!deletedJobRole) {
			res.status(404).json({ error: "Job role not found" });
			return;
		}

		res.status(204).send();
	}

	async getAllJobRoles(req: Request, res: Response): Promise<void> {
		const query = JobRoleFilterQuerySchema.safeParse(req.query);

		if (!query.success) {
			res.status(400).json({ error: "Invalid query parameters" });
			return;
		}

		const { page, pageSize, sortBy, sortOrder, ...filters } = query.data;
		const paginatedJobRoles = await this.jobRoleService.findAll(
			page,
			pageSize,
			filters,
			{ sortBy, sortOrder },
		);
		res.status(200).json(paginatedJobRoles);
	}

	async getFilterOptions(_req: Request, res: Response): Promise<void> {
		const options = await this.jobRoleService.getFilterOptions();
		res.status(200).json(options);
	}
}
