export class JobRole {
	constructor(
		public jobRoleId: number,
		public roleName: string,
		public location: string,
		public capabilityId: number,
		public bandId: number,
		public closingDate: string,
		public status: string,
	) {
		if (!roleName || !location || !closingDate || !status) {
			throw new Error(
				"Role name, location, closing date, and status cannot be empty",
			);
		}
		if (new Date(`${closingDate}T00:00:00.000Z`) <= new Date()) {
			throw new Error("Closing date must be in the future");
		}
		if (bandId <= 0 || capabilityId <= 0 || jobRoleId <= 0) {
			throw new Error(
				"Band ID, Capability ID, and Job Role ID must be positive numbers",
			);
		}
	}
}
