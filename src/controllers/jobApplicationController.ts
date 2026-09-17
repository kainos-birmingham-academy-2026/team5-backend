import type { Request, Response } from "express";
import type { JobApplicationService } from "../services/jobApplicationService";

const APPLICATION_VALIDATION_ERRORS = new Set([
	"Job role is not open for applications",
	"Job role has no open positions",
	"Applicant has already applied for this job role",
]);

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
			const message = error instanceof Error ? error.message : undefined;
			if (message === "Job role not found") {
				res.status(404).json({ error: message });
				return;
			}

			if (message && APPLICATION_VALIDATION_ERRORS.has(message)) {
				res.status(400).json({ error: message });
				return;
			}

			res.status(500).json({ error: "Unable to submit application" });
		}
	}
}
