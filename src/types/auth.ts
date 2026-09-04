export interface AuthUser {
	userId: string;
	email: string;
	roleId: number;
	role: string;
}

declare global {
	namespace Express {
		interface Request {
			user?: AuthUser;
		}
	}
}
