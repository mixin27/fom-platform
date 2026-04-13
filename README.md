# FOM Platform

Monorepo for the FOM Platform ([getfom.com](https://getfom.com)).

[![CI (Flutter)](https://github.com/mixin27/fom-platform/actions/workflows/flutter.yaml/badge.svg?branch=main)](https://github.com/mixin27/fom-platform/actions/workflows/flutter.yaml)
[![CI (Web)](https://github.com/mixin27/fom-platform/actions/workflows/ci.yaml/badge.svg?branch=main)](https://github.com/mixin27/fom-platform/actions/workflows/ci.yaml)
[![Secret Scan](https://github.com/mixin27/fom-platform/actions/workflows/secret_scan.yaml/badge.svg?branch=main)](https://github.com/mixin27/fom-platform/actions/workflows/secret_scan.yaml)

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
