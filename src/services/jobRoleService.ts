import { JobRoleDao } from "../daos/jobRoleDao";
import type {
	CreateJobRoleRequestDto,
	JobRoleResponseDto,
} from "../dtos/jobRoleDto";
import { JobRoleMapper } from "../mappers/jobRoleMapper";

export class JobRoleService {
	constructor(private readonly jobRoleDao: JobRoleDao = new JobRoleDao()) {}

	async findAll(): Promise<JobRoleResponseDto[]> {
		const jobRoles = await this.jobRoleDao.findAll();

		return JobRoleMapper.toResponses(jobRoles);
	}

	async findById(id: number): Promise<JobRoleResponseDto | null> {
		const jobRole = await this.jobRoleDao.findById(id);

		return jobRole ? JobRoleMapper.toResponse(jobRole) : null;
	}

	async create(
		jobRoleData: CreateJobRoleRequestDto,
	): Promise<JobRoleResponseDto> {
		const jobRole = await this.jobRoleDao.create(jobRoleData);

		return JobRoleMapper.toResponse(jobRole);
	}

	async update(
		id: number,
		jobRoleData: Partial<CreateJobRoleRequestDto>,
	): Promise<JobRoleResponseDto | null> {
		if (!jobRoleData || Object.keys(jobRoleData).length === 0) {
			throw new Error("No data provided for update");
		}

		const updatedJobRole = await this.jobRoleDao.update(id, jobRoleData);

		return updatedJobRole ? JobRoleMapper.toResponse(updatedJobRole) : null;
	}

	async delete(id: number): Promise<boolean> {
		if (!id || id <= 0) {
			throw new Error("Invalid ID provided for deletion");
		}

		return this.jobRoleDao.delete(id);
	}
}
