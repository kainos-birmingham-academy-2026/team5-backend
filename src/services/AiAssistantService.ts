import { AzureOpenAiClient } from "../clients/AzureOpenAiClient";
import { JobRoleDao } from "../daos/jobRoleDao";
import type { AiAssistantResponseDto } from "../dtos/aiAssistantDto";

export class AiAssistantService {
	constructor(
		private readonly jobRoleDao: JobRoleDao = new JobRoleDao(),
		private readonly aiClient: AzureOpenAiClient = new AzureOpenAiClient(),
	) {}

	async ask(question: string): Promise<AiAssistantResponseDto> {
		const jobRoles = await this.jobRoleDao.findAllForAssistant();
		const answer = await this.aiClient.answerQuestion(question, jobRoles);

		return { answer };
	}
}
