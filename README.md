# Team 5 Backend

Backend API for managing Job Roles using Node.js, TypeScript, Express, and Prisma.

## Tech Stack

- Node.js
- TypeScript
- Express
- Prisma ORM (`@prisma/client`)
- Zod
- Vitest + Supertest
- Biome (format/lint)

## Current Repository Architecture

```text
.
├── src/
│   ├── app.ts                      # Express app setup + route registration
│   ├── index.ts                    # Server bootstrap (port 3000)
│   ├── prismaClient.ts             # Prisma client instance
│   ├── controllers/
│   │   └── jobRoleController.ts    # HTTP/controller layer
│   ├── services/
│   │   └── jobRoleService.ts       # Business/service layer
│   ├── daos/
│   │   └── jobRoleDao.ts           # Data access with Prisma
│   ├── routes/
│   │   └── jobRoleRouter.ts        # Route wiring
│   ├── dtos/
│   │   └── jobRoleDto.ts           # DTOs + Zod schemas
│   ├── mappers/
│   │   └── jobRoleMapper.ts        # Domain -> response mapping
│   └── models/
│       ├── jobRole.ts              # Domain model
│       └── jobRoleResponse.ts      # Response model
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
├── tests/
│   ├── app.test.ts
│   ├── index.test.ts
│   ├── controllers/
│   │   └── jobRoleController.test.ts
│   ├── services/
│   │   └── jobRoleService.test.ts
│   └── routes/
│       └── jobRoleRoutes.test.ts
├── package.json
└── tsconfig.json
```

## API Endpoints

- `GET /` - Welcome message
- `GET /health` - Service health status
- `GET /job-roles` - List all job roles
- `GET /job-roles/:id` - Get job role by id
- `POST /job-roles` - Create job role
- `PUT /job-roles/:id` - Update job role
- `DELETE /job-roles/:id` - Delete job role

## How to Run

1. Install dependencies:

```bash
npm install
```

2. (If needed for DB-backed flows) ensure `DATABASE_URL` is set in `.env`.

3. Start dev server:

```bash
npm run dev
```

4. Build and run production build:

```bash
npm run build
npm start
```

Server runs on `http://localhost:3000`.

## How to Test

Run all tests once:

```bash
npm test
```

Watch mode:

```bash
npm run test:watch
```

Coverage:

```bash
npm run test:coverage
```

Run specific test suites:

```bash
npx vitest run tests/controllers/jobRoleController.test.ts
npx vitest run tests/services/jobRoleService.test.ts
npx vitest run tests/routes/jobRoleRoutes.test.ts
```

## Useful Quality Commands

```bash
npm run format
npm run lint
npm run check
npm run ci:check
```
