import type { NextFunction, Request, Response } from "express";
import { authenticationService } from "../services/authenticationService";

const APPLICANT_ROLE_ID = 1;

export interface AuthenticatedUser {
	userId: string;
	email: string;
	roleId: number;
}

declare global {
	namespace Express {
		interface Request {
			authenticatedUser?: AuthenticatedUser;
		}
	}
}

export function requireAuthentication(
	req: Request,
	res: Response,
	next: NextFunction,
): void {
	const authorization = req.header("authorization");
	const token = authorization?.startsWith("Bearer ")
		? authorization.slice("Bearer ".length)
		: undefined;

	if (!token) {
		res.status(401).json({ error: "Authentication token is required" });
		return;
	}

	try {
		req.authenticatedUser = authenticationService.verifyToken(token);
		next();
	} catch {
		res.status(401).json({ error: "Invalid or expired token" });
	}
}

export function requireApplicant(
	req: Request,
	res: Response,
	next: NextFunction,
): void {
	if (!req.authenticatedUser) {
		res.status(401).json({ error: "Authentication token is required" });
		return;
	}

	if (req.authenticatedUser.roleId !== APPLICANT_ROLE_ID) {
		res.status(403).json({ error: "Applicant access is required" });
		return;
	}

	next();
}
