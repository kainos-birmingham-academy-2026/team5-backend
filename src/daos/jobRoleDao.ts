import type { Prisma } from "@prisma/client";
import type { CreateJobRoleRequestDto } from "../dtos/jobRoleDto";
import type {
	JobRoleFilterOptionsDto,
	JobRoleFilters,
} from "../dtos/jobRoleFilterDto";
import { JobRole } from "../models/jobRole";
import prisma from "../prismaClient";

const jobRoleRelationsInclude = {
	capability: true,
	band: true,
	statusRef: true,
} as const;

type JobRoleWithRelations = Prisma.JobRoleGetPayload<{
	include: typeof jobRoleRelationsInclude;
}>;

export class JobRoleDao {
	private readonly relationsInclude = jobRoleRelationsInclude;

	private async validateRelations(
		capabilityId: number,
		bandId: number,
		statusId?: number | null,
	): Promise<void> {
		const [capability, band, status] = await Promise.all([
			prisma.capability.findUnique({
				where: { capabilityId },
			}),
			prisma.band.findUnique({
				where: { nameId: bandId },
			}),
			statusId == null
				? Promise.resolve(null)
				: prisma.status.findUnique({
						where: { statusId },
					}),
		]);

		if (!capability) {
			throw new Error(`Capability ${capabilityId} does not exist`);
		}

		if (!band) {
			throw new Error(`Band ${bandId} does not exist`);
		}

		if (statusId != null && !status) {
			throw new Error(`Status ${statusId} does not exist`);
		}
	}

	private toCreateData(jobRoleData: CreateJobRoleRequestDto) {
		return jobRoleData;
	}

	private toUpdateData(jobRoleData: Partial<CreateJobRoleRequestDto>) {
		return jobRoleData;
	}

	private toModel(jobRole: JobRoleWithRelations): JobRole {
		return new JobRole(
			jobRole.jobRoleId,
			jobRole.roleName,
			jobRole.location,
			jobRole.capabilityId,
			jobRole.bandId,
			jobRole.closingDate.toString(),
			jobRole.status,
			jobRole.capability.capabilityName,
			jobRole.band.bandName,
			jobRole.description,
			jobRole.responsibilities,
			jobRole.sharepointUrl,
			jobRole.statusId,
			jobRole.numberOfOpenPositions,
		);
	}

	async findAll(
		page: number,
		pageSize: number,
		filters: JobRoleFilters,
	): Promise<{ jobRoles: JobRole[]; totalItems: number }> {
		const skip = (page - 1) * pageSize;
		const where: Prisma.JobRoleWhereInput = {
			roleName: filters.roleName
				? { contains: filters.roleName, mode: "insensitive" }
				: undefined,
			location: filters.location
				? { contains: filters.location, mode: "insensitive" }
				: undefined,
			capability: filters.capability.length
				? { capabilityName: { in: filters.capability, mode: "insensitive" } }
				: undefined,
			band: filters.band.length
				? { bandName: { in: filters.band, mode: "insensitive" } }
				: undefined,
			status: filters.status.length
				? { in: filters.status, mode: "insensitive" }
				: undefined,
			closingDate: filters.closingDate,
		};

		const [jobRoles, totalItems] = await Promise.all([
			prisma.jobRole.findMany({
				include: this.relationsInclude,
				where,
				skip,
				take: pageSize,
			}),
			prisma.jobRole.count({ where }),
		]);

		return {
			jobRoles: jobRoles.map((jobRole) => this.toModel(jobRole)),
			totalItems,
		};
	}

	async getFilterOptions(): Promise<JobRoleFilterOptionsDto> {
		const [capabilities, bands, statuses] = await Promise.all([
			prisma.capability.findMany({
				select: { capabilityName: true },
				orderBy: { capabilityName: "asc" },
			}),
			prisma.band.findMany({
				select: { bandName: true },
				orderBy: { bandName: "asc" },
			}),
			prisma.jobRole.findMany({
				select: { status: true },
				distinct: ["status"],
				orderBy: { status: "asc" },
			}),
		]);

		return {
			capabilities: capabilities.map(({ capabilityName }) => capabilityName),
			bands: bands.map(({ bandName }) => bandName),
			statuses: statuses.map(({ status }) => status),
		};
	}

	async findById(id: number): Promise<JobRole | null> {
		const jobRole = await prisma.jobRole.findUnique({
			where: { jobRoleId: id },
			include: this.relationsInclude,
		});

		return jobRole ? this.toModel(jobRole) : null;
	}

	async create(jobRoleData: CreateJobRoleRequestDto): Promise<JobRole> {
		await this.validateRelations(
			jobRoleData.capabilityId,
			jobRoleData.bandId,
			jobRoleData.statusId,
		);

		const jobRole = await prisma.jobRole.create({
			data: this.toCreateData(jobRoleData),
			include: this.relationsInclude,
		});

		return this.toModel(jobRole);
	}

	async update(
		id: number,
		jobRoleData: Partial<CreateJobRoleRequestDto>,
	): Promise<JobRole | null> {
		const existingJobRole = await prisma.jobRole.findUnique({
			where: { jobRoleId: id },
		});

		if (!existingJobRole) {
			return null;
		}

		await this.validateRelations(
			jobRoleData.capabilityId ?? existingJobRole.capabilityId,
			jobRoleData.bandId ?? existingJobRole.bandId,
			jobRoleData.statusId ?? existingJobRole.statusId,
		);

		const updatedJobRole = await prisma.jobRole.update({
			where: { jobRoleId: id },
			data: this.toUpdateData(jobRoleData),
			include: this.relationsInclude,
		});

		return this.toModel(updatedJobRole);
	}

	async delete(id: number): Promise<boolean> {
		const existingJobRole = await prisma.jobRole.findUnique({
			where: { jobRoleId: id },
		});

		if (!existingJobRole) {
			return false;
		}

		await prisma.jobRole.delete({
			where: { jobRoleId: id },
		});

		return true;
	}
}
