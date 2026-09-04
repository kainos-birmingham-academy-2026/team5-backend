import express from "express";
import multer from "multer";
import morganMiddleware from "./config/morganMiddleware";
import jobRoleRouter from "./routes/jobRoleRouter";
import userRouter from "./routes/userRouter";

const app = express();

app.use(morganMiddleware);
app.use(express.json());
app.use(jobRoleRouter);
app.use(userRouter);

app.use(
	(
		error: Error,
		_req: express.Request,
		res: express.Response,
		_next: express.NextFunction,
	) => {
		if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
			res.status(400).json({ error: "CV must not exceed 5 MB" });
			return;
		}

		res.status(400).json({ error: error.message });
	},
);

app.get("/", (_req, res) => {
	res.json({ message: "Welcome to the API" });
});

app.get("/health", (_req, res) => {
	res.json({ status: "UP", timestamp: new Date().toLocaleTimeString() });
});

export default app;
