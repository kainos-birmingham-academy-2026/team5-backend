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
	email: z.string().email("Invalid email format"),
	password: z
		.string()
		.min(8, "Password must be at least 8 characters")
		.regex(/[A-Z]/, "Password must contain at least 1 uppercase letter")
		.regex(/[a-z]/, "Password must contain at least 1 lowercase letter")
		.regex(
			/[!@#$%^&*?.\-_,;:'"[\]{}()<>+=/\\]/,
			"Password must contain at least 1 special character (!@#$%^&*?.-_,;:'\"[]{}()<>+=/\\)",
		),
});

export type RegisterRequestDto = z.infer<typeof RegisterRequestSchema>;
