import { JobRoleDao } from "../daos/jobRoleDao";
import type {
	CreateJobRoleRequestDto,
	JobRoleDetailedResponseDto,
	JobRoleResponseDto,
	UpdateJobRoleRequestDto,
} from "../dtos/jobRoleDto";
import type {
	JobRoleFilterOptionsDto,
	JobRoleFilters,
} from "../dtos/jobRoleFilterDto";
import type { JobRoleReferenceDataDto } from "../dtos/jobRoleReferenceDto";
import type { PaginatedJobRolesDto } from "../dtos/paginationDto";
import { JobRoleMapper } from "../mappers/jobRoleMapper";

export class JobRoleService {
	constructor(private readonly jobRoleDao: JobRoleDao = new JobRoleDao()) {}

	async findAll(
		page: number,
		pageSize: number,
		filters: JobRoleFilters = {
			capability: [],
			band: [],
			status: [],
		},
	): Promise<PaginatedJobRolesDto> {
		const { jobRoles, totalItems } = await this.jobRoleDao.findAll(
			page,
			pageSize,
			filters,
		);

		return {
			items: JobRoleMapper.toResponses(jobRoles),
			page,
			pageSize,
			totalItems,
			totalPages: Math.ceil(totalItems / pageSize),
		};
	}

	async getFilterOptions(): Promise<JobRoleFilterOptionsDto> {
		return this.jobRoleDao.getFilterOptions();
	}

	async getReferenceOptions(): Promise<JobRoleReferenceDataDto> {
		return this.jobRoleDao.getReferenceData();
	}

	async findById(id: number): Promise<JobRoleResponseDto | null> {
		const jobRole = await this.jobRoleDao.findById(id);

		return jobRole ? JobRoleMapper.toResponse(jobRole) : null;
	}

	async findDetailedById(
		id: number,
	): Promise<JobRoleDetailedResponseDto | null> {
		const jobRole = await this.jobRoleDao.findById(id);

		return jobRole ? JobRoleMapper.toDetailedResponse(jobRole) : null;
	}

	async create(
		jobRoleData: CreateJobRoleRequestDto,
	): Promise<JobRoleResponseDto> {
		// New roles always start Open (US012); status is only changed via update.
		const jobRole = await this.jobRoleDao.create({
			...jobRoleData,
			status: "Open",
		});

		return JobRoleMapper.toResponse(jobRole);
	}

	async update(
		id: number,
		jobRoleData: UpdateJobRoleRequestDto,
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
