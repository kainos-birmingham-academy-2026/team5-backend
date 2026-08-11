import express from "express";
import { userController } from "../controllers/userController";

const userRouter = express.Router();

userRouter.post("/auth/login", userController.login);
userRouter.post("/auth/register", userController.register);
userRouter.get("/auth/user/:id", userController.getUser);

export default userRouter;
