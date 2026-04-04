# New Project Setup

## Repository Structure
```text
facebook-order-manager/
  apps/
    mobile/
  backend/
  docs/
  infra/
  tools/
```

## Initial Setup Tasks
- Create Flutter app in `apps/mobile`
- Create Laravel project in `backend`
- Configure `.env` and generate `APP_KEY`
- Set up PostgreSQL and run migrations
- Install Laravel Sanctum for API tokens
- Configure queues with Redis
- Add API versioning under `/v1`

## Environment Variables
- `APP_KEY`
- `APP_URL`
- `DB_CONNECTION` set to `pgsql`
- `DB_HOST`
- `DB_PORT`
- `DB_DATABASE`
- `DB_USERNAME`
- `DB_PASSWORD`
- `REDIS_HOST`
- `QUEUE_CONNECTION`
- `CACHE_DRIVER`
- `FILESYSTEM_DISK`

## CI and Quality
- Add PHP linting and formatting
- Run `phpunit` on every push
- Add static analysis with PHPStan or Psalm

## Branching and Releases
- Use `main` for production
- Use `dev` for integration
- Tag releases with `v1.0.0` format

## Definition of Done
- Core flow passes tests
- No critical crashes in last 24 hours
- Burmese UI reviewed on real device
- Pilot users can complete order flow
