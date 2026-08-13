import { z } from "zod";
import type { LoginResponse, UserResponse } from "../models/userResponse";

export type UserResponseDto = UserResponse;
export type LoginResponseDto = LoginResponse;

export const LoginRequestSchema = z.object({
	email: z.string().email("Invalid email format"),
	password: z.string().min(1, "Password is required"),
});

export type LoginRequestDto = z.infer<typeof LoginRequestSchema>;

export const RegisterRequestSchema = z.object({
	firstName: z.string().min(1, "First name is required"),
	lastName: z.string().min(1, "Last name is required"),
	email: z.string().email("Invalid email format"),
	password: z
		.string()
		.min(8, "Password must be at least 8 characters")
		.regex(/[A-Z]/, "Password must contain at least 1 uppercase letter")
		.regex(/[a-z]/, "Password must contain at least 1 lowercase letter")
		.regex(/[!@#$%^&*]/, "Password must contain at least 1 special character (!@#$%^&*)"),
	role: z.enum(["applicant", "recruiter", "admin"]).default("applicant"),
});

export type RegisterRequestDto = z.infer<typeof RegisterRequestSchema>;
