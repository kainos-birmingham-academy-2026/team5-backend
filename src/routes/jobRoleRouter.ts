import { Router } from "express";
import { JobRoleController } from "../controllers/jobRoleController.js";
import { JobRoleDao } from "../daos/jobRoleDao.js";
import { authMiddleware, requireRole } from "../middleware/authMiddleware.js";
import { JobRoleService } from "../services/jobRoleService.js";

const jobRoleRouter = Router();

const jobRoleDao = new JobRoleDao();
const jobRoleService = new JobRoleService(jobRoleDao);
const jobRoleController = new JobRoleController(jobRoleService);

jobRoleRouter.get(
	"/job-roles",
	authMiddleware,
	jobRoleController.getAllJobRoles.bind(jobRoleController),
);
jobRoleRouter.get(
	"/job-roles/filter-options",
	authMiddleware,
	jobRoleController.getFilterOptions.bind(jobRoleController),
);
jobRoleRouter.get(
	"/job-roles/:id",
	authMiddleware,
	jobRoleController.getJobRoleById.bind(jobRoleController),
);
jobRoleRouter.post(
	"/job-roles",
	authMiddleware,
	requireRole("admin"),
	jobRoleController.createJobRole.bind(jobRoleController),
);
jobRoleRouter.put(
	"/job-roles/:id",
	authMiddleware,
	requireRole("admin"),
	jobRoleController.updateJobRole.bind(jobRoleController),
);
jobRoleRouter.delete(
	"/job-roles/:id",
	authMiddleware,
	requireRole("admin"),
	jobRoleController.deleteJobRole.bind(jobRoleController),
);

export default jobRoleRouter;
