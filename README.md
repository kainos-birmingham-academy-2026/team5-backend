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
- `GET /job-roles` - List all job roles
- `GET /job-roles/:id` - Get job role by id
- `POST /job-roles` - Create job role
- `PUT /job-roles/:id` - Update job role
- `DELETE /job-roles/:id` - Delete job role

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
