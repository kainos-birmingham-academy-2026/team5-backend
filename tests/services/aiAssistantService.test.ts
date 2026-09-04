import { describe, expect, it, vi } from "vitest";
import type { AzureOpenAiClient } from "../../src/clients/AzureOpenAiClient";
import type { JobRoleDao } from "../../src/daos/jobRoleDao";
import { AiAssistantService } from "../../src/services/AiAssistantService";

describe("AiAssistantService", () => {
	it("loads every approved job role and returns the AI answer", async () => {
		const jobRoles = [
			{
				jobRoleId: 11,
				roleName: "Platform Engineer",
				location: "Belfast",
				capabilityName: "Engineering",
				bandName: "Band 2",
				closingDate: "2027-12-31",
				status: "Open",
				description: "Build platforms",
				responsibilities: "Own delivery",
				numberOfOpenPositions: 2,
			},
		];
		const jobRoleDao = {
			findAllForAssistant: vi.fn().mockResolvedValue(jobRoles),
		} as unknown as JobRoleDao;
		const aiClient = {
			answerQuestion: vi.fn().mockResolvedValue("One matching role is open."),
		} as unknown as AzureOpenAiClient;
		const service = new AiAssistantService(jobRoleDao, aiClient);

		const response = await service.ask("Show me open engineering jobs");

		expect(jobRoleDao.findAllForAssistant).toHaveBeenCalledOnce();
		expect(aiClient.answerQuestion).toHaveBeenCalledWith(
			"Show me open engineering jobs",
			jobRoles,
		);
		expect(response).toEqual({ answer: "One matching role is open." });
	});
});
