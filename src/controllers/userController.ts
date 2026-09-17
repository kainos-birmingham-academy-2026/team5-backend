import type { Request, Response } from "express";
import { userDao } from "../daos/userDao";
import { LoginRequestSchema, RegisterRequestSchema } from "../dtos/userDto";
import { toDomain, toResponse } from "../mappers/userMapper";
import { authenticationService } from "../services/authenticationService";

export class UserController {
	async login(req: Request, res: Response): Promise<void> {
		try {
			const validation = LoginRequestSchema.safeParse(req.body);
			if (!validation.success) {
				res.status(400).json({ error: validation.error.issues });
				return;
			}

			const { email, password } = validation.data;
			const result = await authenticationService.login(email, password);

			res.status(200).json(result);
		} catch (error) {
			const message = error instanceof Error ? error.message : "Login failed";
			res.status(401).json({ error: message });
		}
	}

	async register(req: Request, res: Response): Promise<void> {
		try {
			const validation = RegisterRequestSchema.safeParse(req.body);
			if (!validation.success) {
				res.status(400).json({ error: validation.error.issues });
				return;
			}

			const result = await authenticationService.register(validation.data);

			res.status(201).json(result);
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Registration failed";
			res.status(400).json({ error: message });
		}
	}

	async getUser(req: Request, res: Response): Promise<void> {
		try {
			const id = Array.isArray(req.params.id)
				? req.params.id[0]
				: req.params.id;

			if (!id) {
				res.status(400).json({ error: "User ID is required" });
				return;
			}

			const requester = req.user;
			if (!requester) {
				res.status(401).json({ error: "Authentication token required" });
				return;
			}

			const isAdmin = requester.role === "admin";
			if (!isAdmin && requester.userId !== id) {
				res.status(403).json({ error: "Forbidden" });
				return;
			}

			const prismaUser = await userDao.findById(id);

			if (!prismaUser) {
				res.status(404).json({ error: "User not found" });
				return;
			}

			const user = toDomain(prismaUser);
			res.status(200).json(toResponse(user));
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Failed to retrieve user";
			res.status(500).json({ error: message });
		}
	}
}

export const userController = new UserController();
