import type { Request, Response } from "express";
import {
	CreateJobRoleSchema,
	UpdateJobRoleSchema,
} from "../dtos/jobRoleDto";
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
		const parsed = CreateJobRoleSchema.safeParse(req.body);
		if (!parsed.success) {
			res.status(400).json({
				error: "Invalid job role data",
				details: parsed.error.issues,
			});
			return;
		}

		try {
			const createdJobRole = await this.jobRoleService.create(parsed.data);
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

		const parsed = UpdateJobRoleSchema.safeParse(req.body);
		if (!parsed.success) {
			res.status(400).json({
				error: "Invalid job role data",
				details: parsed.error.issues,
			});
			return;
		}

		if (Object.keys(parsed.data).length === 0) {
			res.status(400).json({ error: "No data provided for update" });
			return;
		}

		try {
			const updatedJobRole = await this.jobRoleService.update(id, parsed.data);
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

		try {
			const deletedJobRole = await this.jobRoleService.delete(id);
			if (!deletedJobRole) {
				res.status(404).json({ error: "Job role not found" });
				return;
			}

			res.status(204).send();
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Unable to delete job role";
			const status =
				message === "Cannot delete a job role with existing applications"
					? 409
					: 400;
			res.status(status).json({ error: message });
		}
	}

	async getAllJobRoles(req: Request, res: Response): Promise<void> {
		const query = JobRoleFilterQuerySchema.safeParse(req.query);

		if (!query.success) {
			res.status(400).json({ error: "Invalid query parameters" });
			return;
		}

		const { page, pageSize, ...filters } = query.data;
		const paginatedJobRoles = await this.jobRoleService.findAll(
			page,
			pageSize,
			filters,
		);
		res.status(200).json(paginatedJobRoles);
	}

	async getFilterOptions(_req: Request, res: Response): Promise<void> {
		const options = await this.jobRoleService.getFilterOptions();
		res.status(200).json(options);
	}

	async getReferenceOptions(_req: Request, res: Response): Promise<void> {
		const options = await this.jobRoleService.getReferenceOptions();
		res.status(200).json(options);
	}
}
