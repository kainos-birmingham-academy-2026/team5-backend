import { afterEach, describe, expect, it, vi } from "vitest";
import {
	AiAssistantConfigurationError,
	AiAssistantProviderError,
	ClaudeClient,
	type ClaudeMessagesClient,
} from "../../src/clients/ClaudeClient";

describe("ClaudeClient", () => {
	const originalApiKey = process.env.ANTHROPIC_API_KEY;

	afterEach(() => {
		vi.resetAllMocks();
		if (originalApiKey === undefined) {
			delete process.env.ANTHROPIC_API_KEY;
		} else {
			process.env.ANTHROPIC_API_KEY = originalApiKey;
		}
	});

	it("sends only the question and approved job role context without tools", async () => {
		const create = vi.fn().mockResolvedValue({
			content: [{ type: "text", text: "The Platform Engineer role matches." }],
		});
		const client = new ClaudeClient({ create } as ClaudeMessagesClient);
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
			model: "claude-haiku-4-5-20251001",
			max_tokens: 500,
			temperature: 0.2,
			messages: [{ role: "user" }],
		});
		expect(request).not.toHaveProperty("tools");
		expect(request.messages).toHaveLength(1);
		expect(JSON.parse(request.messages[0].content as string)).toEqual({
			question: "Which engineering jobs are open?",
			jobRoles,
		});
	});

	it("rejects requests when the server API key is not configured", async () => {
		delete process.env.ANTHROPIC_API_KEY;

		await expect(
			new ClaudeClient().answerQuestion("What is open?", []),
		).rejects.toBeInstanceOf(AiAssistantConfigurationError);
	});

	it("rejects a response that contains no text", async () => {
		const create = vi.fn().mockResolvedValue({ content: [] });

		await expect(
			new ClaudeClient({ create } as ClaudeMessagesClient).answerQuestion(
				"What is open?",
				[],
			),
		).rejects.toBeInstanceOf(AiAssistantProviderError);
	});
});
