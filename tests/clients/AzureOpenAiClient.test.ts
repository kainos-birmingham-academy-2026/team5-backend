import { afterEach, describe, expect, it, vi } from "vitest";
import {
	AiAssistantConfigurationError,
	AiAssistantProviderError,
	AzureOpenAiClient,
	type AzureOpenAiResponsesClient,
} from "../../src/clients/AzureOpenAiClient";

describe("AzureOpenAiClient", () => {
	const originalDeployment = process.env.AZURE_OPENAI_DEPLOYMENT;

	afterEach(() => {
		vi.resetAllMocks();
		if (originalDeployment === undefined) {
			delete process.env.AZURE_OPENAI_DEPLOYMENT;
		} else {
			process.env.AZURE_OPENAI_DEPLOYMENT = originalDeployment;
		}
	});

	it("sends only the question and approved job role context without tools", async () => {
		process.env.AZURE_OPENAI_DEPLOYMENT = "gpt-4o";
		const create = vi.fn().mockResolvedValue({
			output_text: "The Platform Engineer role matches.",
		});
		const client = new AzureOpenAiClient({
			create,
		} as AzureOpenAiResponsesClient);
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

		const answer = await client.answerQuestion(
			"Which engineering jobs are open?",
			jobRoles,
		);

		expect(answer).toBe("The Platform Engineer role matches.");
		expect(create).toHaveBeenCalledOnce();
		const request = create.mock.calls[0][0];
		expect(request).toMatchObject({
			model: "gpt-4o",
			max_output_tokens: 500,
			reasoning: { effort: "minimal" },
			input: [{ role: "system" }, { role: "user" }],
		});
		expect(request).not.toHaveProperty("temperature");
		expect(request).not.toHaveProperty("tools");
		expect(request.input).toHaveLength(2);
		expect(JSON.parse(request.input[1].content)).toEqual({
			question: "Which engineering jobs are open?",
			jobRoles,
		});
	});

	it("rejects requests when the deployment is not configured", async () => {
		delete process.env.AZURE_OPENAI_DEPLOYMENT;

		await expect(
			new AzureOpenAiClient().answerQuestion("What is open?", []),
		).rejects.toBeInstanceOf(AiAssistantConfigurationError);
	});

	it("rejects a response that contains no text", async () => {
		process.env.AZURE_OPENAI_DEPLOYMENT = "gpt-4o";
		const create = vi.fn().mockResolvedValue({ output_text: "" });

		await expect(
			new AzureOpenAiClient({
				create,
			} as AzureOpenAiResponsesClient).answerQuestion("What is open?", []),
		).rejects.toBeInstanceOf(AiAssistantProviderError);
	});
});
