export class User {
	constructor(
		public id: string,
		public email: string,
		public password: string,
		public roleId: number,
		public createdAt: Date,
		public updatedAt: Date,
		public role: string,
	) {
		if (!email || !password || roleId === undefined || !role) {
			throw new Error("Email, password, and role are required");
		}
		// Basic email validation
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			throw new Error("Invalid email format");
		}
	}
}
