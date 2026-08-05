import express from "express";
import jobRoleRouter from "./routes/jobRoleRouter";

const app = express();

app.use(express.json());
app.use(jobRoleRouter);

app.get("/", (_req, res) => {
	res.json({ message: "Welcome to the API" });
});

app.get("/health", (_req, res) => {
	res.json({ status: "UP", timestamp: new Date().toLocaleTimeString() });
});

export default app;
