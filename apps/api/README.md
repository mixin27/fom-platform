# Facebook Order Manager API

NestJS backend for the Facebook Order Manager app. The API is now backed by a local PostgreSQL database through Prisma ORM.

## Stack

- NestJS 11
- Prisma 7
- PostgreSQL
- Fastify adapter for e2e tests

## API Scope

Implemented under `/api/v1`:

- OTP auth and bearer sessions
- current user profile
- shops and members
- customers
- orders
- order items
- order status updates
- daily summaries
- RBAC for owner/staff permissions

## Local Database

Copy the example environment file and point it to your local PostgreSQL server:

```bash
cp .env.example .env
```

Default connection string:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/fom_platform_api?schema=public"
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

- owner session token: `tok_demo_owner`
- owner user: `09 7800 1111`
- staff user: `09 7800 2222`
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
