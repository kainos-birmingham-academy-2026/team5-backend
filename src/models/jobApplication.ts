export class JobApplication {
	constructor(
		public applicationId: number,
		public applicantId: string,
		public jobRoleId: number,
		public cvBlobName: string | null,
		public cvFileName: string,
		public cvMimeType: string,
		public cvScanStatus: string,
		public status: string,
		public createdAt: Date,
		public updatedAt: Date,
	) {}
}
