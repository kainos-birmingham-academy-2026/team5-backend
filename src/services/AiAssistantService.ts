import { ClaudeClient } from "../clients/ClaudeClient";
import { JobRoleDao } from "../daos/jobRoleDao";
import type { AiAssistantResponseDto } from "../dtos/aiAssistantDto";

export class AiAssistantService {
	constructor(
		private readonly jobRoleDao: JobRoleDao = new JobRoleDao(),
		private readonly claudeClient: ClaudeClient = new ClaudeClient(),
	) {}

	async ask(question: string): Promise<AiAssistantResponseDto> {
		const jobRoles = await this.jobRoleDao.findAllForAssistant();
		const answer = await this.claudeClient.answerQuestion(question, jobRoles);

		return { answer };
	}
}
