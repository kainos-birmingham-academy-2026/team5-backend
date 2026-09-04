# Team 5 Backend

Backend API for the Team 5 careers application, using Node.js, TypeScript,
Express, and Prisma. The server-rendered web application is in the sibling
[team5-frontend repository](https://github.com/kainos-birmingham-academy-2026/team5-frontend).

## Run the Complete Application

Keep both repositories next to each other with these directory names:

```text
Group project/
├── team5-backend/
└── team5-frontend/
```

From inside either repository, run:

```bash
npm run dev:stack
```

Or, from the parent `Group project` workspace directory, run:

```bash
npm run dev:stack --prefix team5-backend
```

This one command:

1. Installs frontend or backend dependencies when `node_modules` is missing.
2. Loads `team5-backend/.env` when present.
3. Uses its `DATABASE_URL`, starting a matching stopped local Docker container
  when found, or starts the included Docker PostgreSQL when none is set.
4. Generates the Prisma client, deploys migrations, and safely seeds data.
5. Starts the backend and frontend with `[backend]` and `[frontend]` log prefixes.

Open the frontend at `http://localhost:4000`. The backend API is available at
`http://localhost:3000`. Press Ctrl+C once to stop both Node services.

Docker PostgreSQL remains running so its data is preserved. Stop it separately
with:

```bash
docker compose -f compose.dev.yml down
```

To use an existing local or hosted PostgreSQL database instead, copy
`.env.example` to `.env`, uncomment `DATABASE_URL`, and provide the correct
connection string. Docker is only required when `DATABASE_URL` is absent. The
Docker fallback exposes PostgreSQL on host port `5433` to avoid clashing with a
standard local PostgreSQL installation on `5432`.

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
│   ├── app.ts                           # Express app setup + route registration
│   ├── index.ts                         # Server bootstrap (port 3000)
│   ├── prismaClient.ts                  # Prisma client instance
│   ├── controllers/
│   │   ├── jobRoleController.ts         # Job role HTTP/controller layer
│   │   └── userController.ts            # User/auth HTTP/controller layer
│   ├── services/
│   │   ├── jobRoleService.ts            # Job role business logic
│   │   └── authenticationService.ts     # Authentication business logic
│   ├── daos/
│   │   ├── jobRoleDao.ts                # Job role data access with Prisma
│   │   └── userDao.ts                   # User data access with Prisma
│   ├── routes/
│   │   ├── jobRoleRouter.ts             # Job role route wiring
│   │   └── userRouter.ts                # Authentication route wiring
│   ├── dtos/
│   │   ├── jobRoleDto.ts                # Job role DTOs + Zod schemas
│   │   └── userDto.ts                   # User DTOs + Zod schemas
│   ├── mappers/
│   │   ├── jobRoleMapper.ts             # Job role domain -> response mapping
│   │   └── userMapper.ts                # User domain -> response mapping
│   └── models/
│       ├── jobRole.ts                   # Job role domain model
│       ├── jobRoleResponse.ts           # Job role response model
│       ├── user.ts                      # User domain model
│       └── userResponse.ts              # User response model
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
├── tests/
│   ├── app.test.ts
│   ├── index.test.ts
│   ├── controllers/
│   │   ├── jobRoleController.test.ts
│   │   └── userController.test.ts
│   ├── services/
│   │   ├── jobRoleService.test.ts
│   │   └── authenticationService.test.ts
│   └── routes/
│       ├── jobRoleRoutes.test.ts
│       └── userRoutes.test.ts
├── AUTHENTICATION.md                     # Authentication system documentation
├── package.json
└── tsconfig.json
```

## API Endpoints

### Health & General
- `GET /` - Welcome message
- `GET /health` - Service health status

### Authentication
- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login with email and password

### Job Roles
- `GET /job-roles` - List job roles with pagination and optional filters: `roleName`, `location`, `capability`, `band`, `status`, and `closingDate`. Repeat checkbox parameters such as `status=Open&status=Closed` to match either value.
- `GET /job-roles/filter-options` - List available capability, band, and status filter values
- `GET /job-roles/:id` - Get job role by id
- `POST /job-roles` - Create job role
- `PUT /job-roles/:id` - Update job role
- `DELETE /job-roles/:id` - Delete job role

### AI Assistant
- `POST /assistant/questions` - Ask a question grounded only in the current job roles

Request:

```json
{
  "question": "Which open engineering roles are based in Belfast?"
}
```

Response:

```json
{
  "answer": "The available job role information shows..."
}
```

Set `ANTHROPIC_API_KEY` in `.env` before using this endpoint. The key stays on
the backend. Requests use the pinned Claude Haiku 4.5 model, include no tools or
conversation history, and are limited to 10 requests per minute per client.
The database query and mapper explicitly allowlist the job-role fields sent to
Anthropic. Questions are limited to 1,000 characters and responses to 500
tokens.

Job-role text is transmitted to Anthropic to generate each answer. Do not put
secrets or personal data in those fields. Confirm that your Anthropic account's
retention settings meet your organisation's requirements before production use.

## Authentication System

This backend includes a complete user authentication system with JWT-based token management. Key features:

- **User Registration**: Create new user accounts with email and password
- **User Login**: Authenticate with email and password, receive JWT token
- **Password Security**: Passwords are hashed with bcrypt (10 salt rounds)
- **JWT Tokens**: 24-hour expiration with HS256 algorithm
- **Role-Based Infrastructure**: Support for different user roles (applicant, recruiter, admin)
- **Bearer Token Response**: Tokens returned in response body for client storage

For detailed authentication documentation, see [AUTHENTICATION.md](AUTHENTICATION.md).

### Registration Example

```json
POST /auth/register
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "password123",
  "roleId": "applicant"
}
```

### Login Example

```json
POST /auth/login
{
  "email": "john@example.com",
  "password": "password123"
}
```

Response includes JWT token for authenticated requests.

## Run the Backend Only

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env` and set `DATABASE_URL`.

3. Prepare Prisma and start the development server:

```bash
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
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

## Automated Code Review

Pull requests targeting `main` or `master` run
`.github/workflows/code-review.yml`, which invokes the repository's
`/local-code-review` Copilot skill. The review appears on the workflow Summary
page, and the generated `code_reviews/` directory is also uploaded as an
artifact.

Before using the workflow, add a repository Actions secret named
`COPILOT_TOKEN`. Its fine-grained personal access token must have the
**Copilot Requests** permission. The standard `GITHUB_TOKEN` cannot make
Copilot requests.

The review runs when a pull request is opened, reopened, marked ready, or
updated with new commits. Forked pull requests are skipped because GitHub does
not expose repository secrets to forks.
