# FOM Platform API

NestJS backend for the FOM Platform ([getfom.com](https://getfom.com)). The API is now backed by a local PostgreSQL database through Prisma ORM.

## Stack

- NestJS 11
- Prisma 7
- PostgreSQL
- Redis
- Fastify adapter for e2e tests

## API Scope

Implemented under `/api/v1`:

- email/password auth with access and refresh tokens
- phone OTP auth as an optional sign-in method
- social identity sign-in records for Google and Facebook
- current user profile
- shops and members
- customers
- orders
- order items
- order status updates
- daily summaries
- weekly reports
- monthly reports
- database-backed RBAC with roles, permissions, and role assignments

## Local Database

Copy the example environment file and point it to your local PostgreSQL server:

```bash
cp .env.example .env
```

Default connection string:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/fom_platform_api?schema=public"
JWT_ACCESS_SECRET="dev_access_secret_change_me_facebook_order_manager"
JWT_REFRESH_SECRET="dev_refresh_secret_change_me_facebook_order_manager"
REDIS_URL="redis://localhost:6379/0"
```

Create the database if it does not already exist:

```bash
createdb -U postgres fom_platform_api
```

If you do not have `createdb` locally, create the same database name using your PostgreSQL admin tool and keep `DATABASE_URL` aligned.

## Docker Compose

From the repository root:

```bash
pnpm docker:up
```

This starts:

- API on `http://localhost:4000`
- PostgreSQL on `localhost:5432`
- Redis on `localhost:6379`

The API container applies Prisma migrations on startup. It does not seed automatically. To load demo data into the Docker PostgreSQL instance, run:

```bash
pnpm docker:seed
```

Useful container commands:

```bash
pnpm docker:logs
pnpm docker:down
```

Compose values can be overridden through a root-level `.env` file, for example:

```bash
API_PORT=4000
POSTGRES_DB=fom_platform_api
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_PORT=5432
REDIS_PORT=6379
JWT_ACCESS_SECRET=dev_access_secret_change_me_facebook_order_manager
JWT_REFRESH_SECRET=dev_refresh_secret_change_me_facebook_order_manager
```

## Setup

Install dependencies and generate the Prisma client:

```bash
pnpm install
```

Apply migrations and seed demo data locally:

```bash
pnpm db:setup
```

The seed creates:

- platform owner login: `owner@fom-platform.local` / `Password123!`
- owner login: `maaye@example.com` / `Password123!`
- staff login: `komin@example.com` / `Password123!`
- owner phone: `09 7800 1111`
- staff phone: `09 7800 2222`
- demo shop: `Ma Aye Shop`

## Development

```bash
pnpm start:dev
```

Useful Prisma commands:

```bash
pnpm prisma:validate
pnpm prisma:generate
pnpm prisma:migrate:dev
pnpm prisma:migrate:deploy
pnpm prisma:push
pnpm prisma:seed
pnpm prisma:seed:demo
pnpm db:reset
```

`src/generated/prisma` is generated code and is intentionally ignored from git.

## Auth Notes

- `POST /api/v1/auth/register` creates an account with email/password.
- `POST /api/v1/auth/login` accepts `email` plus `password`.
- `POST /api/v1/auth/refresh` rotates JWT access and refresh tokens.
- `POST /api/v1/auth/phone/start` and `POST /api/v1/auth/phone/verify` support optional phone OTP login.
- `POST /api/v1/auth/social/login` stores provider identities for `google` and `facebook`.
- Access JWT payloads include platform-scoped and shop-scoped roles and permissions so the web and mobile clients can tailor UX without an extra lookup.
- Sessions persist request metadata including IP address and user-agent so later device/session management work has a reliable base.

Social login currently persists the provider identity supplied by the caller. Provider token verification still needs to be added before treating it as production-ready OAuth.

## API Docs

- Swagger UI: `/docs`
- OpenAPI JSON: `/openapi.json`
- OpenAPI YAML: `/openapi.yaml`
- Scalar API Reference: `/reference`

Scalar is the recommended interactive surface for manual API testing.

## RBAC Notes

- Roles live in the `roles` table.
- Permissions live in the `permissions` table.
- Role-to-permission mappings live in `roles_permissions_assignment`.
- Platform-level user roles are assigned through `user_role_assignments`.
- Shop membership roles are assigned through `shop_member_role_assignments`.
- `pnpm prisma:seed` is production-safe and only syncs the RBAC catalog.
- Demo users, shops, and orders are only loaded through `pnpm prisma:seed:demo` or `pnpm db:setup`.
- The default seeded roles are `platform_owner`, `owner`, and `staff`.

## Testing

Unit tests:

```bash
pnpm test
```

E2E tests without a running database only execute the lightweight overview check:

```bash
pnpm test:e2e
```

To run database-backed e2e coverage, make sure PostgreSQL is running, the schema is migrated, and then run:

```bash
RUN_DB_E2E=1 pnpm test:e2e
```

## Migration Files

The initial Prisma SQL migration lives in `prisma/migrations/20260405000000_init/migration.sql`.

Use `prisma:migrate:dev` for new schema changes during development so Prisma keeps migration history in sync.
