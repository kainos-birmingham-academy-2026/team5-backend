import { Router } from "express";
import { JobRoleController } from "../controllers/jobRoleController.js";
import { JobRoleDao } from "../daos/jobRoleDao.js";
import { JobRoleService } from "../services/jobRoleService.js";

const jobRoleRouter = Router();

const jobRoleDao = new JobRoleDao();
const jobRoleService = new JobRoleService(jobRoleDao);
const jobRoleController = new JobRoleController(jobRoleService);

jobRoleRouter.get(
	"/job-roles",
	jobRoleController.getAllJobRoles.bind(jobRoleController),
);
jobRoleRouter.get(
	"/job-roles/:id",
	jobRoleController.getJobRoleById.bind(jobRoleController),
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
