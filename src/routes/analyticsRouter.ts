import { Router } from "express";
import { AnalyticsController } from "../controllers/analyticsController.js";
import { AnalyticsDao } from "../daos/analyticsDao.js";
import { authMiddleware, requireRole } from "../middleware/authMiddleware.js";
import { AnalyticsService } from "../services/analyticsService.js";

const analyticsRouter = Router();

const analyticsDao = new AnalyticsDao();
const analyticsService = new AnalyticsService(analyticsDao);
const analyticsController = new AnalyticsController(analyticsService);

analyticsRouter.get(
	"/analytics/overview",
	authMiddleware,
	requireRole("admin"),
	analyticsController.getOverview,
);
analyticsRouter.get(
	"/analytics/job-roles",
	authMiddleware,
	requireRole("admin"),
	analyticsController.getJobRoles,
);

export default analyticsRouter;
