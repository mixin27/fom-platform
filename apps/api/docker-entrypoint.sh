#!/bin/sh
set -eu

echo "Applying Prisma migrations..."
pnpm prisma:migrate:deploy

exec node dist/src/main.js
