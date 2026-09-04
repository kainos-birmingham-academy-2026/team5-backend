import { z } from "zod";

export const AskAiAssistantSchema = z.object({
	question: z.string().trim().min(1).max(1000),
});

export type AskAiAssistantRequestDto = z.infer<typeof AskAiAssistantSchema>;

export interface AiAssistantResponseDto {
	answer: string;
}

export interface AiAssistantJobRoleContextDto {
	jobRoleId: number;
	roleName: string;
	location: string;
	capabilityName: string;
	bandName: string;
	closingDate: string;
	status: string;
	description: string | null;
	responsibilities: string | null;
	numberOfOpenPositions: number | null;
}
