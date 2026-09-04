import type { NextFunction, Request, Response } from "express";
import { authenticationService } from "../services/authenticationService";
import type { AuthUser } from "../types/auth";

export function authMiddleware(
	req: Request,
	res: Response,
	next: NextFunction,
): void {
	const authHeader = req.headers.authorization;
	if (!authHeader?.startsWith("Bearer ")) {
		res.status(401).json({ error: "Authentication token required" });
		return;
	}

	const token = authHeader.slice("Bearer ".length).trim();
	if (!token) {
		res.status(401).json({ error: "Authentication token required" });
		return;
	}

	try {
		const user: AuthUser = authenticationService.verifyToken(token);
		req.user = user;
		next();
	} catch {
		res.status(401).json({ error: "Invalid or expired token" });
	}
}

export function requireRole(...allowedRoles: string[]) {
	return (req: Request, res: Response, next: NextFunction): void => {
		if (!req.user) {
			res.status(401).json({ error: "Authentication token required" });
			return;
		}

		if (!allowedRoles.includes(req.user.role)) {
			res.status(403).json({ error: "Forbidden" });
			return;
		}

		next();
	};
}
