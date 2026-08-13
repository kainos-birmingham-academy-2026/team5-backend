---
name: run-dev-stack
description: 'Set up and run the complete Team 5 application stack: PostgreSQL, Prisma migrations and seed data, backend API, and frontend. Use when asked to start, launch, run, or troubleshoot local full-stack development.'
argument-hint: 'Optional: describe a startup error to troubleshoot'
---

# Run Team 5 Development Stack

Start the frontend, backend, and database through the repository-owned stack
launcher.

## Procedure

1. Confirm `team5-backend` and `team5-frontend` are sibling directories. Stop
   and explain the expected layout if either is missing.
2. Run `npm run dev:stack` from either repository, or run
   `npm run dev:stack --prefix team5-backend` from their parent workspace.
   This is a long-running development process, so start it in a persistent
   terminal.
3. The launcher installs dependencies only when `node_modules` is missing.
4. If `team5-backend/.env` or the shell provides a local `DATABASE_URL`, the
   launcher starts a stopped Docker PostgreSQL container mapped to that port
   when one exists. Non-local URLs are left untouched. Without `DATABASE_URL`,
   it starts PostgreSQL from `team5-backend/compose.dev.yml`.
5. The launcher runs `prisma generate`, `prisma migrate deploy`, and
   `prisma db seed`, then starts both services.
6. Confirm the prefixed logs show the backend at `http://localhost:3000` and
   frontend at `http://localhost:4000`. Report the frontend URL to the user.
7. Keep the process running until the user stops it. Ctrl+C stops both Node
   services; Docker PostgreSQL and its data remain available for future runs.

## Troubleshooting

- Treat `[backend]`, `[frontend]`, `[database]`, and `[setup]` as separate log
  sources when reporting failures.
- If Docker fallback fails, verify Docker is installed and running and port
   `5433` is free.
- If an external database fails, verify `DATABASE_URL` in
  `team5-backend/.env` and database availability.
- If either service cannot bind, check ports `3000` and `4000`.
- Do not reset or delete database data. The seed is designed to preserve
  unrelated development records.