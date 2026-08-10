export class User {
	constructor(
		public id: string,
		public firstName: string,
		public lastName: string,
		public email: string,
		public password: string,
		public roleId: number,
		public createdAt: Date,
		public updatedAt: Date,
	) {
		if (!firstName || !lastName || !email || !password || roleId === undefined) {
			throw new Error(
				"First name, last name, email, password, and role are required",
			);
		}
		// Basic email validation
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			throw new Error("Invalid email format");
		}
	}
}
