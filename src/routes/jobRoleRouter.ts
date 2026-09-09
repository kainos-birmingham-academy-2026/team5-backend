import { Router } from "express";
import { JobApplicationController } from "../controllers/jobApplicationController.js";
import { JobRoleController } from "../controllers/jobRoleController.js";
import { JobApplicationDao } from "../daos/jobApplicationDao.js";
import { JobRoleDao } from "../daos/jobRoleDao.js";
import {
	requireApplicant,
	requireAuthentication,
} from "../middleware/authenticationMiddleware.js";
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
	jobRoleController.getAllJobRoles.bind(jobRoleController),
);
jobRoleRouter.get(
	"/job-roles/filter-options",
	jobRoleController.getFilterOptions.bind(jobRoleController),
);
jobRoleRouter.get(
	"/job-roles/:id",
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
	jobRoleController.createJobRole.bind(jobRoleController),
);
jobRoleRouter.put(
	"/job-roles/:id",
	jobRoleController.updateJobRole.bind(jobRoleController),
);
jobRoleRouter.delete(
	"/job-roles/:id",
	jobRoleController.deleteJobRole.bind(jobRoleController),
);

export default jobRoleRouter;
