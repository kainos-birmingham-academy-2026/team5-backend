export class JobRole {
	constructor(
		public jobRoleId: number,
		public roleName: string,
		public location: string,
		public capabilityId: number,
		public bandId: number,
		public closingDate: string,
		public status: string,
		public capabilityName = "",
		public bandName = "",
		public description: string | null = null,
		public responsibilities: string | null = null,
		public sharepointUrl: string | null = null,
		public statusId: number | null = null,
		public numberOfOpenPositions: number | null = null,
	) {
		if (!roleName || !location || !closingDate || !status) {
			throw new Error(
				"Role name, location, closing date, and status cannot be empty",
			);
		}
		if (bandId <= 0 || capabilityId <= 0 || jobRoleId <= 0) {
			throw new Error(
				"Band ID, Capability ID, and Job Role ID must be positive numbers",
			);
		}
	}
}
