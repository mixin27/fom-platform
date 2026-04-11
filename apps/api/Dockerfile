FROM node:22-bookworm-slim

ARG DATABASE_URL=postgresql://postgres:postgres@postgres:5432/fom_platform_api?schema=public

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
ENV DATABASE_URL=$DATABASE_URL

RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/* \
  && corepack enable

WORKDIR /workspace

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/api/package.json apps/api/package.json
COPY apps/api/prisma.config.ts apps/api/prisma.config.ts
COPY apps/api/prisma apps/api/prisma

RUN pnpm install --frozen-lockfile --filter api...

COPY apps/api ./apps/api

RUN pnpm --dir apps/api build

WORKDIR /workspace/apps/api

EXPOSE 4000

CMD ["sh", "./docker-entrypoint.sh"]
