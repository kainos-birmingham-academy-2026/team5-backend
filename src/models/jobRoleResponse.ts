export interface JobRoleResponse {
	jobRoleId: number;
	roleName: string;
	location: string;
	capabilityName: string;
	bandName: string;
	closingDate: string;
	status: string;
}

export interface JobRoleDetailedResponse extends JobRoleResponse {
	capabilityId: number;
	bandId: number;
	description?: string | null;
	responsibilities?: string | null;
	sharepointUrl?: string | null;
	statusId?: number | null;
	numberOfOpenPositions?: number | null;
}
