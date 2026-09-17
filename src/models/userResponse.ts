export interface UserResponse {
	id: string;
	email: string;
	roleId: number;
	role: string;
	createdAt: Date;
	updatedAt: Date;
}

export interface LoginResponse {
	user: UserResponse;
	token: string;
}
