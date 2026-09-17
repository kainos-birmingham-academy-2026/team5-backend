import { Router } from "express";
import { JobApplicationController } from "../controllers/jobApplicationController.js";
import { JobRoleController } from "../controllers/jobRoleController.js";
import { JobApplicationDao } from "../daos/jobApplicationDao.js";
import { JobRoleDao } from "../daos/jobRoleDao.js";
import {
	requireApplicant,
	requireAuthentication,
} from "../middleware/authenticationMiddleware.js";
import { authMiddleware, requireRole } from "../middleware/authMiddleware.js";
import { cvUpload } from "../middleware/cvUploadMiddleware.js";
import { JobApplicationService } from "../services/jobApplicationService.js";
import { JobRoleService } from "../services/jobRoleService.js";

const jobRoleRouter = Router();

const jobRoleDao = new JobRoleDao();
const jobRoleService = new JobRoleService(jobRoleDao);
const jobRoleController = new JobRoleController(jobRoleService);
const jobApplicationDao = new JobApplicationDao();
const jobApplicationService = new JobApplicationService(
	jobApplicationDao,
	jobRoleDao,
);
const jobApplicationController = new JobApplicationController(
	jobApplicationService,
);

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
	"/job-roles/:id/applications",
	requireAuthentication,
	requireApplicant,
	cvUpload.single("cv"),
	jobApplicationController.apply.bind(jobApplicationController),
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
