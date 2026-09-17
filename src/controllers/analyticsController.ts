import type { Request, Response } from "express";
import {
	AnalyticsJobRolesQuerySchema,
	AnalyticsRangeQuerySchema,
} from "../dtos/analyticsDto";
import Logger from "../lib/logger";
import {
	AnalyticsRangeError,
	type AnalyticsService,
} from "../services/analyticsService";

export class AnalyticsController {
	constructor(private readonly analyticsService: AnalyticsService) {
		this.getOverview = this.getOverview.bind(this);
		this.getJobRoles = this.getJobRoles.bind(this);
	}

	async getOverview(req: Request, res: Response): Promise<void> {
		const parsed = AnalyticsRangeQuerySchema.safeParse(req.query);
		if (!parsed.success) {
			res.status(400).json({
				error: "Invalid analytics query",
				details: parsed.error.issues,
			});
			return;
		}

		try {
			res
				.status(200)
				.json(await this.analyticsService.getOverview(parsed.data));
		} catch (error) {
			this.handleFailure(error, res, "analytics overview");
		}
	}

	async getJobRoles(req: Request, res: Response): Promise<void> {
		const parsed = AnalyticsJobRolesQuerySchema.safeParse(req.query);
		if (!parsed.success) {
			res.status(400).json({
				error: "Invalid analytics query",
				details: parsed.error.issues,
			});
			return;
		}

		try {
			res
				.status(200)
				.json(await this.analyticsService.getJobRoles(parsed.data));
		} catch (error) {
			this.handleFailure(error, res, "analytics job roles");
		}
	}

	private handleFailure(error: unknown, res: Response, context: string): void {
		if (error instanceof AnalyticsRangeError) {
			res.status(400).json({ error: error.message });
			return;
		}

		// Prisma and stack details stay in the log; the client only sees a generic message.
		Logger.error(
			`Failed to build ${context}: ${error instanceof Error ? error.message : "unknown error"}`,
		);
		res.status(500).json({ error: "Unable to load analytics" });
	}
}
