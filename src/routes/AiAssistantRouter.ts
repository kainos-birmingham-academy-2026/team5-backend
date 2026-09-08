import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { AiAssistantController } from "../controllers/AiAssistantController";
import { JobRoleDao } from "../daos/jobRoleDao";
import { AiAssistantService } from "../services/AiAssistantService";

const aiAssistantRouter = Router();

const jobRoleDao = new JobRoleDao();
const aiAssistantService = new AiAssistantService(jobRoleDao);
const aiAssistantController = new AiAssistantController(aiAssistantService);

const assistantRateLimit = rateLimit({
	windowMs: 60_000,
	limit: 10,
	standardHeaders: "draft-8",
	legacyHeaders: false,
	message: { error: "Too many assistant requests; please try again shortly" },
});

aiAssistantRouter.post(
	"/assistant/questions",
	assistantRateLimit,
	aiAssistantController.ask.bind(aiAssistantController),
);

export default aiAssistantRouter;
