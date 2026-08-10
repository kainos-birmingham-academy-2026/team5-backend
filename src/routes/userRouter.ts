import express from "express";
import { userController } from "../controllers/userController";

const userRouter = express.Router();

userRouter.post("/auth/login", (req, res) => userController.login(req, res));
userRouter.post("/auth/register", (req, res) =>
	userController.register(req, res),
);
userRouter.get("/auth/user/:id", (req, res) =>
	userController.getUser(req, res),
);

export default userRouter;
