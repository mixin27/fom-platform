# Facebook Order Manager Platform

Monorepo for the Facebook Order Manager project.

## Apps

- `apps/api`: NestJS + Prisma backend
- `apps/mobile`: Flutter mobile app
- `apps/web`: web surfaces and supporting UI work

## Local Infrastructure

The repository includes Docker Compose for the API stack:

- API
- PostgreSQL
- Redis

Start the stack from the repository root:

```bash
pnpm docker:up
```

Useful commands:

```bash
pnpm docker:logs
pnpm docker:seed
pnpm docker:down
```

`pnpm docker:seed` loads the explicit demo dataset into the Docker PostgreSQL instance. The base API seed remains production-safe and only syncs RBAC roles, permissions, and role-permission assignments.

The API listens on `http://localhost:4000` by default. More API-specific setup notes live in [apps/api/README.md](./apps/api/README.md).
