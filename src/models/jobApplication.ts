export class JobApplication {
	constructor(
		public applicationId: number,
		public applicantId: string,
		public jobRoleId: number,
		public cvFileName: string,
		public cvMimeType: string,
		public status: string,
		public createdAt: Date,
		public updatedAt: Date,
	) {}
}