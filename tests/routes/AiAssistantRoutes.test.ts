import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AiAssistantConfigurationError } from "../../src/clients/ClaudeClient";

const serviceMock = vi.hoisted(() => ({
	ask: vi.fn(),
}));

vi.mock("../../src/services/AiAssistantService.js", () => ({
	AiAssistantService: vi.fn(function AiAssistantServiceMock() {
		return serviceMock;
	}),
}));

import app from "../../src/app";

describe("AI Assistant Routes", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	it("POST /assistant/questions returns a user-friendly answer", async () => {
		serviceMock.ask.mockResolvedValue({
			answer: "There is one open engineering role in Belfast.",
		});

		const response = await request(app)
			.post("/assistant/questions")
			.send({ question: "  What engineering roles are open?  " });

		expect(response.status).toBe(200);
		expect(response.body).toEqual({
			answer: "There is one open engineering role in Belfast.",
		});
		expect(serviceMock.ask).toHaveBeenCalledWith(
			"What engineering roles are open?",
		);
	});

	it.each([{}, { question: "" }, { question: "x".repeat(1001) }])(
		"POST /assistant/questions rejects invalid input",
		async (body) => {
			const response = await request(app)
				.post("/assistant/questions")
				.send(body);

			expect(response.status).toBe(400);
			expect(response.body).toEqual({
				error: "Question must be between 1 and 1000 characters",
			});
			expect(serviceMock.ask).not.toHaveBeenCalled();
		},
	);

	it("does not expose missing API key details", async () => {
		serviceMock.ask.mockRejectedValue(
			new AiAssistantConfigurationError("ANTHROPIC_API_KEY is not configured"),
		);

		const response = await request(app)
			.post("/assistant/questions")
			.send({ question: "What roles are open?" });

		expect(response.status).toBe(503);
		expect(response.body).toEqual({ error: "AI assistant is not configured" });
		expect(response.text).not.toContain("ANTHROPIC_API_KEY");
	});
});
