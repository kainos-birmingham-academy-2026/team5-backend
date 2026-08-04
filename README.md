# Team 5 Backend

## Problem Statement

Currently within Kainos there is not one source of truth to view job roles and the relevant information attached (e.g. job descriptions, capability, competencies, banding, training etc). This can be confusing and time consuming for employees to retrieve the relevant job role information.

## Vision

An online job application that serves both Kainos recruitment admin to retrieve and update job roles and their relevant information, and applicants to apply for roles.

## Current Repository Setup

This repository contains the backend service foundation for the Team 5 application. It is currently set up as a Node.js and TypeScript Express API starter with a basic app entrypoint and health endpoint.

### Technology Stack

- Node.js
- TypeScript
- Express
- Zod
- Prisma Client
- Vitest + Supertest

### Project Structure

```text
.
├── src/
│   ├── app.ts
│   └── index.ts
├── dist/
├── package.json
└── tsconfig.json
```

### Available Scripts

- `npm run dev`: Run the API in watch mode using `tsx`.
- `npm run build`: Compile TypeScript into `dist/`.
- `npm start`: Start the compiled app from `dist/index.js`.
- `npm test`: Run tests once with Vitest.
- `npm run test:watch`: Run tests in watch mode.
- `npm run test:coverage`: Run tests with coverage.

### Current API Endpoints

- `GET /`: Returns a welcome message.
- `GET /health`: Returns service status and current server time.

Example health response:

```json
{
	"status": "UP",
	"timestamp": "10:31:52 AM"
}
```

### Local Development

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm run dev
```

3. Verify service health:

```bash
curl http://localhost:3000/health
```
