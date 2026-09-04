import type { Request, Response } from "express";
import type { JobApplicationService } from "../services/jobApplicationService";

export class JobApplicationController {
	constructor(private readonly jobApplicationService: JobApplicationService) {}

	async apply(req: Request, res: Response): Promise<void> {
		const jobRoleId = Number(req.params.id);

		if (Number.isNaN(jobRoleId) || jobRoleId <= 0) {
			res.status(400).json({ error: "Invalid job role ID provided" });
			return;
		}

		if (!req.authenticatedUser) {
			res.status(401).json({ error: "Authentication token is required" });
			return;
		}

		if (!req.file) {
			res.status(400).json({ error: "CV file is required" });
			return;
		}

		try {
			const application = await this.jobApplicationService.apply({
				applicantId: req.authenticatedUser.userId,
				jobRoleId,
				cvData: req.file.buffer,
				cvFileName: req.file.originalname,
				cvMimeType: req.file.mimetype,
			});

			res.status(201).json(application);
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Unable to submit application";
			res.status(message === "Job role not found" ? 404 : 400).json({
				error: message,
			});
		}
	}
}