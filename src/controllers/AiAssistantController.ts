import type { Request, Response } from "express";
import {
	AiAssistantConfigurationError,
	AiAssistantProviderError,
} from "../clients/ClaudeClient";
import { AskAiAssistantSchema } from "../dtos/aiAssistantDto";
import type { AiAssistantService } from "../services/AiAssistantService";

export class AiAssistantController {
	constructor(private readonly aiAssistantService: AiAssistantService) {}

	async ask(req: Request, res: Response): Promise<void> {
		const request = AskAiAssistantSchema.safeParse(req.body);

		if (!request.success) {
			res.status(400).json({
				error: "Question must be between 1 and 1000 characters",
			});
			return;
		}

		try {
			const response = await this.aiAssistantService.ask(request.data.question);
			res.status(200).json(response);
		} catch (error) {
			if (error instanceof AiAssistantConfigurationError) {
				res.status(503).json({ error: "AI assistant is not configured" });
				return;
			}

			if (error instanceof AiAssistantProviderError) {
				res
					.status(502)
					.json({ error: "AI assistant is temporarily unavailable" });
				return;
			}

			res
				.status(502)
				.json({ error: "AI assistant is temporarily unavailable" });
		}
	}
}
