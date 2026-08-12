import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";

const backendDirectory = path.resolve(
	path.dirname(fileURLToPath(import.meta.url)),
	"..",
);
const frontendDirectory = path.resolve(backendDirectory, "../team5-frontend");
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const services = [];
let stopping = false;

function run(command, args, options = {}) {
	return new Promise((resolve, reject) => {
		const child = spawn(command, args, {
			cwd: options.cwd,
			env: options.env ?? process.env,
			stdio: "inherit",
		});

		child.once("error", reject);
		child.once("exit", (code, signal) => {
			if (code === 0) {
				resolve();
				return;
			}

			reject(
				new Error(
					`${command} ${args.join(" ")} failed ${signal ? `with ${signal}` : `with exit code ${code}`}`,
				),
			);
		});
	});
}

function capture(command, args) {
	return new Promise((resolve, reject) => {
		const child = spawn(command, args, {
			stdio: ["ignore", "pipe", "pipe"],
		});
		let stdout = "";
		let stderr = "";

		child.stdout.on("data", (chunk) => {
			stdout += chunk;
		});
		child.stderr.on("data", (chunk) => {
			stderr += chunk;
		});
		child.once("error", reject);
		child.once("exit", (code) => resolve({ code, stdout, stderr }));
	});
}

async function waitForPostgres(containerId, databaseUrl) {
	const username = decodeURIComponent(databaseUrl.username);
	const database = decodeURIComponent(databaseUrl.pathname.slice(1));

	for (let attempt = 0; attempt < 30; attempt += 1) {
		const result = await capture("docker", [
			"exec",
			containerId,
			"pg_isready",
			"-U",
			username,
			"-d",
			database,
		]);
		if (result.code === 0) {
			console.log("[database] Local PostgreSQL container is ready.");
			return;
		}

		await new Promise((resolve) => setTimeout(resolve, 500));
	}

	throw new Error("Local PostgreSQL container did not become ready in time.");
}

async function startConfiguredLocalDatabase(databaseUrlValue) {
	let databaseUrl;
	try {
		databaseUrl = new URL(databaseUrlValue);
	} catch {
		return;
	}

	if (!["localhost", "127.0.0.1", "::1"].includes(databaseUrl.hostname)) {
		return;
	}

	let containerIds;
	try {
		containerIds = await capture("docker", ["container", "ls", "-aq"]);
	} catch {
		return;
	}

	if (containerIds.code !== 0 || !containerIds.stdout.trim()) {
		return;
	}

	const ids = containerIds.stdout.trim().split(/\s+/);
	const inspection = await capture("docker", ["inspect", ...ids]);
	if (inspection.code !== 0) {
		return;
	}

	const hostPort = databaseUrl.port || "5432";
	const containers = JSON.parse(inspection.stdout);
	const container = containers.find((candidate) =>
		candidate.HostConfig.PortBindings?.["5432/tcp"]?.some(
			(binding) => binding.HostPort === hostPort,
		),
	);

	if (!container) {
		return;
	}

	const containerName = container.Name.replace(/^\//, "");
	if (!container.State.Running) {
		console.log(
			`[database] Starting local PostgreSQL container ${containerName}...`,
		);
		await run("docker", ["start", container.Id]);
	} else {
		console.log(
			`[database] Local PostgreSQL container ${containerName} is running.`,
		);
	}

	await waitForPostgres(container.Id, databaseUrl);
}

async function installDependencies(directory, label) {
	if (existsSync(path.join(directory, "node_modules"))) {
		return;
	}

	console.log(`[setup] Installing ${label} dependencies...`);
	await run(npmCommand, ["install"], { cwd: directory });
}

function prefixOutput(stream, label, output) {
	createInterface({ input: stream }).on("line", (line) => {
		output.write(`[${label}] ${line}\n`);
	});
}

function startService(label, directory) {
	const child = spawn(npmCommand, ["run", "dev"], {
		cwd: directory,
		env: process.env,
		stdio: ["ignore", "pipe", "pipe"],
	});

	prefixOutput(child.stdout, label, process.stdout);
	prefixOutput(child.stderr, label, process.stderr);
	child.once("error", (error) => {
		console.error(`[${label}] Failed to start: ${error.message}`);
		stopServices(1);
	});
	child.once("exit", (code, signal) => {
		if (!stopping) {
			console.error(
				`[${label}] Stopped ${signal ? `with ${signal}` : `with exit code ${code}`}.`,
			);
			stopServices(code ?? 1);
		}
	});
	services.push(child);
}

function stopServices(exitCode = 0) {
	if (stopping) {
		return;
	}

	stopping = true;
	for (const child of services) {
		if (!child.pid || child.killed) {
			continue;
		}

		try {
			child.kill("SIGTERM");
		} catch (error) {
			if (error.code !== "ESRCH") {
				console.error(
					`[setup] Could not stop process ${child.pid}: ${error.message}`,
				);
			}
		}
	}

	process.exitCode = exitCode;
}

async function main() {
	if (!existsSync(frontendDirectory)) {
		throw new Error(`Frontend repository not found at ${frontendDirectory}`);
	}
	process.env.XDG_CACHE_HOME ??= path.join(tmpdir(), "team5-dev-cache");

	await installDependencies(backendDirectory, "backend");
	await installDependencies(frontendDirectory, "frontend");

	const { config } = await import("dotenv");
	config({ path: path.join(backendDirectory, ".env") });

	if (!process.env.DATABASE_URL) {
		console.log(
			"[database] DATABASE_URL is not set; starting Docker PostgreSQL...",
		);
		await run(
			"docker",
			["compose", "-f", "compose.dev.yml", "up", "-d", "--wait"],
			{ cwd: backendDirectory },
		);
		process.env.DATABASE_URL =
			"postgresql://team5:team5@localhost:5433/team5?schema=public";
	} else {
		console.log(
			"[database] Using DATABASE_URL from the environment or backend .env.",
		);
		await startConfiguredLocalDatabase(process.env.DATABASE_URL);
	}

	console.log("[database] Generating Prisma client...");
	await run("npx", ["prisma", "generate"], { cwd: backendDirectory });
	console.log("[database] Applying pending migrations...");
	await run("npx", ["prisma", "migrate", "deploy"], {
		cwd: backendDirectory,
	});
	console.log("[database] Seeding development data...");
	await run("npx", ["prisma", "db", "seed"], { cwd: backendDirectory });

	console.log("[setup] Starting backend on http://localhost:3000");
	console.log("[setup] Starting frontend on http://localhost:4000");
	console.log("[setup] Press Ctrl+C to stop both services.");
	startService("backend", backendDirectory);
	startService("frontend", frontendDirectory);
}

process.once("SIGINT", () => stopServices());
process.once("SIGTERM", () => stopServices());

main().catch((error) => {
	console.error(`[setup] ${error.message}`);
	stopServices(1);
});
