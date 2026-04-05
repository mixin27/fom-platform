# Facebook Order Manager API

NestJS backend for the Facebook Order Manager app. The API is now backed by a local PostgreSQL database through Prisma ORM.

## Stack

- NestJS 11
- Prisma 7
- PostgreSQL
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
```

Create the database if it does not already exist:

```bash
createdb -U postgres fom_platform_api
```

If you do not have `createdb` locally, create the same database name using your PostgreSQL admin tool and keep `DATABASE_URL` aligned.

## Setup

Install dependencies and generate the Prisma client:

```bash
pnpm install
```

Apply migrations and seed demo data:

```bash
pnpm db:setup
```

The seed creates:

- owner login: `maaye@example.com` / `Password123!`
- staff login: `komin@example.com` / `Password123!`
- owner phone: `09 7800 1111`
- staff phone: `09 7800 2222`
- demo shop: `shop_ma_aye`

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
pnpm db:reset
```

`src/generated/prisma` is generated code and is intentionally ignored from git.

## Auth Notes

- `POST /api/v1/auth/register` creates an account with email/password.
- `POST /api/v1/auth/login` accepts `email` plus `password`.
- `POST /api/v1/auth/refresh` rotates JWT access and refresh tokens.
- `POST /api/v1/auth/phone/start` and `POST /api/v1/auth/phone/verify` support optional phone OTP login.
- `POST /api/v1/auth/social/login` stores provider identities for `google` and `facebook`.
- Access JWT payloads include shop-scoped `roles` and `permissions` so the mobile app can tailor UX without an extra lookup.
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
- Shop membership roles are assigned through `shop_member_role_assignments`.
- The default seeded roles are `owner` and `staff`.

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
