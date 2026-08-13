---
description: Global coding guidelines and conventions for all team5-backend work
applyTo: '**'
---

# Global Coding Guidelines & Conventions

## Naming Conventions

### TypeScript/JavaScript Files & Classes
- **Files**: Use PascalCase for class-based files (e.g., `JobRoleDao.ts`, `UserController.ts`)
- **Classes**: Use PascalCase (e.g., `JobRoleService`, `UserController`)
- **Functions/Methods**: Use camelCase (e.g., `findAll`, `createJobRole`)
- **Constants**: Use UPPER_SNAKE_CASE (e.g., `MAX_PAGE_SIZE`, `DEFAULT_ROLE_ID`)
- **Variables**: Use camelCase (e.g., `jobRoleId`, `pageSize`)

### Database & Models
- **Table names**: Use kebab-case in migrations (e.g., `job-roles`, `users`)
- **Database columns**: Use camelCase mapping in Prisma schema
- **Model class names**: Use PascalCase (e.g., `JobRole`, `User`)
- **DTO names**: Suffix with `Dto` (e.g., `JobRoleDto`, `CreateJobRoleRequestDto`)

### Testing
- **Test files**: Mirror source structure with `.test.ts` suffix (e.g., `jobRoleDao.test.ts` for `jobRoleDao.ts`)
- **Test names**: Use `describe()` for class/module names and `it()` for specific test cases

## Code Structure & Methods

### Repository Pattern (DAO Layer)
- Data access objects handle direct database interactions via Prisma
- Include relationships as needed (e.g., `include: { capability: true, band: true, statusRef: true }`)
- Keep database queries isolated from business logic
- Return typed models, not raw Prisma objects

### Service Layer
- Services contain business logic and orchestration
- Accept DTOs for input validation
- Use mappers to convert between models and responses
- Handle data transformation and validation

### Controller Layer
- Controllers parse HTTP requests and delegate to services
- Return consistent response formats
- Handle HTTP status codes appropriately
- Validate request parameters exist before calling services

### Testing Patterns
- Mock external dependencies (Prisma) using `vi.hoisted()` and `vi.mock()`
- Test mocks should expect the same parameters as the actual implementation
- Include `statusRef` in relation includes when mocking job role queries
- Use `toHaveBeenCalledWith()` for exact parameter verification

## Code Conventions

### Project Standards
- Use TypeScript with strict type checking
- Use Prisma for database operations
- Use Vitest for unit testing
- Follow MVC architecture: Models → DAOs → Services → Controllers → Routes
- Use DTOs for API request/response contracts

### Import/Export Patterns
- Use ES6 module syntax (`import`/`export`)
- Group imports: external libraries first, then local files
- Use default export for classes in DAO/Service/Controller files

### Error Handling
- Throw descriptive errors with context (e.g., `throw new Error('Capability X does not exist')`)
- Let errors propagate up the stack for centralized handling
- Include relevant IDs or values in error messages

## Asking for Clarification

When encountering ambiguity, ask clarifying questions about:
- **Scope**: Is this feature isolated to one component or affects multiple layers?
- **Requirements**: Are there specific validation rules or business logic constraints?
- **Data relationships**: How should related entities be included/excluded in responses?
- **Status/State**: Which status values are valid? Should defaults be applied?
- **Testing**: Should edge cases or specific scenarios be tested?

Always verify assumptions before implementing to ensure alignment with the codebase and team expectations.