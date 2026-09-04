import express from "express";
import { userController } from "../controllers/userController";
import { authMiddleware } from "../middleware/authMiddleware";

const userRouter = express.Router();

userRouter.post("/auth/login", userController.login);
userRouter.post("/auth/register", userController.register);
userRouter.get("/auth/user/:id", authMiddleware, userController.getUser);

export default userRouter;
