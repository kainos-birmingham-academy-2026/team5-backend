import type { JobRole as PrismaJobRole } from "@prisma/client";
import type { CreateJobRoleRequestDto } from "../dtos/jobRoleDto";
import { JobRole } from "../models/jobRole";
import prisma from "../prismaClient";

export class JobRoleDao {
	private async validateRelations(
		capabilityId: number,
		bandId: number,
	): Promise<void> {
		const [capability, band] = await Promise.all([
			prisma.capability.findUnique({
				where: { capabilityId },
			}),
			prisma.band.findUnique({
				where: { nameId: bandId },
			}),
		]);

		if (!capability) {
			throw new Error(`Capability ${capabilityId} does not exist`);
		}

		if (!band) {
			throw new Error(`Band ${bandId} does not exist`);
		}
	}

	private toPrismaClosingDate(closingDate: string): Date {
		return new Date(`${closingDate}T00:00:00.000Z`);
	}

	private toCreateData(jobRoleData: CreateJobRoleRequestDto) {
		return {
			...jobRoleData,
			closingDate: this.toPrismaClosingDate(jobRoleData.closingDate),
		};
	}

	private toUpdateData(jobRoleData: Partial<CreateJobRoleRequestDto>) {
		return {
			...jobRoleData,
			...(jobRoleData.closingDate
				? {
						closingDate: this.toPrismaClosingDate(jobRoleData.closingDate),
					}
				: {}),
		};
	}

	private toModel(jobRole: PrismaJobRole): JobRole {
		return new JobRole(
			jobRole.jobRoleId,
			jobRole.roleName,
			jobRole.location,
			jobRole.capabilityId,
			jobRole.bandId,
			jobRole.closingDate,
			jobRole.status,
		);
	}

	async findAll(): Promise<JobRole[]> {
		const jobRoles = await prisma.jobRole.findMany();

		return jobRoles.map((jobRole) => this.toModel(jobRole));
	}

	async findById(id: number): Promise<JobRole | null> {
		const jobRole = await prisma.jobRole.findUnique({
			where: { jobRoleId: id },
		});

		return jobRole ? this.toModel(jobRole) : null;
	}

	async create(jobRoleData: CreateJobRoleRequestDto): Promise<JobRole> {
		await this.validateRelations(jobRoleData.capabilityId, jobRoleData.bandId);

		const jobRole = await prisma.jobRole.create({
			data: this.toCreateData(jobRoleData),
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
		);

		const updatedJobRole = await prisma.jobRole.update({
			where: { jobRoleId: id },
			data: this.toUpdateData(jobRoleData),
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
