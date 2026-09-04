# User Authentication System Documentation

## Overview

This backend implements a complete user authentication system with JWT token-based authentication. The system follows the acceptance criteria with user login, logout, password hashing, JWT token generation, and role-based access control infrastructure.

## Features

- **User Registration**: Create new user accounts with email, password, first name, last name, and role
- **User Login**: Authenticate users with email and password
- **Password Security**: Passwords are salted and hashed using bcrypt before storage
- **JWT Authentication**: Bearer token generation and verification
- **Role-Based Access**: Support for three user roles: `applicant`, `recruiter`, and `admin`
- **Database Relationships**: Users belong to roles through foreign key relationships

## Database Schema

### Users Table
```sql
- id (UUID, Primary Key)
- firstName (String)
- lastName (String)
- email (String, Unique)
- password (String, Hashed)
- roleId (UUID, Foreign Key -> Roles.id)
- createdAt (DateTime, Auto-managed)
- updatedAt (DateTime, Auto-managed)
```

### Roles Table
```sql
- id (UUID, Primary Key)
- name (String, Unique) - Values: 'applicant', 'recruiter', 'admin'
- createdAt (DateTime, Auto-managed)
- updatedAt (DateTime, Auto-managed)
```

## API Endpoints

### Register User
**POST** `/auth/register`

Creates a new user account.

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "applicant"
}
```

**Response (201 Created):**
```json
{
  "user": {
    "id": "uuid-string",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "roleId": "role-uuid",
    "createdAt": "2026-08-07T14:00:00Z",
    "updatedAt": "2026-08-07T14:00:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**
- `400 Bad Request`: Validation errors (invalid email, short password, missing fields, etc.)
- `400 Bad Request`: User with email already exists

**Validation Rules:**
- `firstName`: Required, non-empty string
- `lastName`: Required, non-empty string
- `email`: Required, valid email format, must be unique
- `password`: Required, minimum 6 characters
- `role`: Optional, defaults to "applicant", must be one of: "applicant", "recruiter", "admin"

### Login User
**POST** `/auth/login`

Authenticates a user and returns a JWT token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "user": {
    "id": "uuid-string",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "roleId": "role-uuid",
    "createdAt": "2026-08-07T14:00:00Z",
    "updatedAt": "2026-08-07T14:00:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**
- `400 Bad Request`: Validation errors (invalid email format, missing password)
- `401 Unauthorized`: Invalid email or password combination

## JWT Token

### Token Structure
- **Type**: Bearer token
- **Algorithm**: HS256
- **Expiration**: 24 hours
- **Payload**:
  ```json
  {
    "userId": "user-uuid",
    "email": "user@example.com",
    "roleId": 1,
    "role": "applicant",
    "iat": 1691419200,
    "exp": 1691505600
  }
  ```

### Using the Token
Include the token in the `Authorization` header for subsequent requests:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Logout
Logout is a client-side operation. Simply:
1. Remove the stored JWT token from browser storage (localStorage, sessionStorage, or cookies)
2. Subsequent API requests without the token will be rejected with 401 Unauthorized

## Project Structure

```
src/
├── controllers/
│   ├── userController.ts         # Request handlers for auth endpoints
│   └── jobRoleController.ts
├── services/
│   ├── authenticationService.ts  # Business logic for auth
│   └── jobRoleService.ts
├── daos/
│   ├── userDao.ts                # Database access for users
│   └── jobRoleDao.ts
├── models/
│   ├── user.ts                   # User domain model
│   ├── userResponse.ts           # Response types
│   └── jobRole.ts
├── dtos/
│   ├── userDto.ts                # DTOs and Zod schemas
│   └── jobRoleDto.ts
├── mappers/
│   ├── userMapper.ts             # Entity mapping
│   └── jobRoleMapper.ts
├── routes/
│   ├── userRouter.ts             # Auth routes
│   └── jobRoleRouter.ts
├── app.ts                        # Express app setup
├── index.ts                      # Server entry point
└── prismaClient.ts               # Prisma client singleton

prisma/
├── schema.prisma                 # Database schema
├── seed.ts                       # Database seeding
└── migrations/                   # Migration files

tests/
├── controllers/
│   ├── userController.test.ts
│   └── jobRoleController.test.ts
├── services/
│   ├── authenticationService.test.ts
│   └── jobRoleService.test.ts
└── routes/
    ├── userRoutes.test.ts
    └── jobRoleRoutes.test.ts
```

## Authentication Flow

### Registration
1. Frontend sends registration request with user details
2. Backend validates input using Zod schemas
3. Backend checks if email already exists
4. Backend hashes password using bcrypt (10 salt rounds)
5. Backend creates user record in database
6. Backend generates JWT token
7. Backend returns user data and token to frontend
8. Frontend stores token (implementation dependent - localStorage, sessionStorage, or secure cookie)

### Login
1. Frontend sends login request with email and password
2. Backend validates input
3. Backend retrieves user by email
4. Backend compares provided password with hashed password using bcrypt
5. If match: generates JWT token and returns user data + token
6. If no match: returns 401 Unauthorized
7. Frontend stores token

### Protected Routes
1. Frontend includes token in Authorization header: `Bearer <token>`
2. `authMiddleware` verifies the token signature and expiration
3. If valid: the decoded user (`userId`, `email`, `roleId`, `role`) is attached to `req.user`
4. If missing or invalid: returns 401 Unauthorized
5. Write endpoints (`POST`, `PUT`, `DELETE /job-roles`) also require `requireRole("admin")`
6. Non-admin authenticated users receive 403 Forbidden on write endpoints
7. `POST /auth/register` and `POST /auth/login` remain public
8. `GET /` and `GET /health` remain public health/welcome routes

## Security Considerations
- **Password Storage**: All passwords are hashed with bcrypt (10 salt rounds) before storage
- **Token Security**: 
  - Tokens use HS256 algorithm
  - Secret key should be stored in environment variables (currently `JWT_SECRET`)
  - Tokens expire after 24 hours
  - Change `JWT_SECRET` to a strong value in production
- **HTTPS**: All API calls should use HTTPS in production
- **Token Storage**: Frontend should use secure storage mechanism (HttpOnly cookies recommended)

## Environment Variables

```
DATABASE_URL=postgresql://user:password@localhost:5432/jobs
JWT_SECRET=your-secure-secret-key-here
NODE_ENV=development
```

## Dependencies

- **bcrypt** (^5.1.1): Password hashing
- **jsonwebtoken** (^9.0.2): JWT token generation and verification
- **express** (^4.22.2): Web framework
- **@prisma/client** (^6.19.3): ORM for database access
- **zod** (^4.4.3): Schema validation

## Testing

Run all tests:
```bash
npm run test
```

Run tests in watch mode:
```bash
npm run test:watch
```

Run tests with coverage:
```bash
npm run test:coverage
```

### Test Coverage

- **Unit Tests**: UserController, AuthenticationService
- **Integration Tests**: User routes, authentication flows
- **Mock Tests**: Database access, service interactions

All 65 tests pass successfully.

## Running the Application

### Development
```bash
npm run dev
```

### Build
```bash
npm run build
```

### Start (Production)
```bash
npm run start
```

## Database Setup

### Initial Setup
1. Ensure PostgreSQL is running
2. Set `DATABASE_URL` environment variable
3. Run migrations:
   ```bash
   npx prisma migrate dev
   ```
4. Seed the database with roles:
   ```bash
   npx prisma db seed
   ```

### View Database
Open Prisma Studio to browse data:
```bash
npx prisma studio
```

## Future Enhancements

1. **Role-Based Access Control (RBAC)**
   - Implement middleware to check user roles
   - Protect endpoints based on roles

2. **Refresh Tokens**
   - Implement refresh token mechanism
   - Add token refresh endpoint

3. **Email Verification**
   - Verify email before account activation
   - Send verification emails

4. **Password Reset**
   - Implement password reset functionality
   - Send reset links via email

5. **2FA (Two-Factor Authentication)**
   - Add additional security layer
   - Support TOTP or SMS-based 2FA

6. **OAuth Integration**
   - Support social login (Google, GitHub, etc.)
   - Simplify registration process

7. **User Profile Management**
   - Update user information
   - Change password endpoint
   - Delete account functionality

## Example Frontend Integration

### Using Bearer Token with Fetch
```javascript
const token = localStorage.getItem('authToken');

const response = await fetch('http://api.example.com/protected-route', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

### Using Axios
```javascript
import axios from 'axios';

const token = localStorage.getItem('authToken');

const axiosInstance = axios.create({
  baseURL: 'http://api.example.com',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

## Troubleshooting

### Common Issues

1. **"User with this email already exists"**
   - Email is already registered
   - Use login instead of registration
   - Use a different email address

2. **"Invalid email or password"**
   - Email doesn't exist in database
   - Password is incorrect
   - Check for typos

3. **"Invalid or expired token"**
   - Token has expired (24-hour limit)
   - Token is malformed or tampered with
   - User needs to login again

4. **Database connection errors**
   - Ensure PostgreSQL is running
   - Check `DATABASE_URL` environment variable
   - Verify database credentials

## Support

For issues or questions, please refer to the project documentation or contact the development team.
