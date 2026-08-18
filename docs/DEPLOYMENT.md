# MedLink — Production Deployment Guide

This guide covers deploying the API + PostgreSQL on Railway and the frontend on Netlify.

> **Important:** This is a deployment checklist, not a guarantee that a third-party platform's current pricing or free tier is available. Verify current platform pricing and limits before deploying.

## 1. Prerequisites

- Node.js 20+
- pnpm 9+
- Git
- A Railway project with PostgreSQL
- A Netlify site

## 2. Railway PostgreSQL

1. Create a PostgreSQL service in Railway.
2. Copy its `DATABASE_URL`.
3. Keep the database private; do not expose PostgreSQL publicly unless your architecture requires it.

## 3. Railway API

Deploy the repository using `apps/api/Dockerfile`.

Set these variables on the API service:

```text
NODE_ENV=production
PORT=3000
DATABASE_URL=<Railway PostgreSQL DATABASE_URL>
JWT_SECRET=<64+ character cryptographically random secret>
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY_DAYS=7
FRONTEND_URL=https://YOUR_NETLIFY_DOMAIN
```

Do not set a production `JWT_SECRET` to a sample value and do not commit secrets to Git.

The application also supports discrete database variables (`DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_NAME`, `DATABASE_USER`, `DATABASE_PASSWORD`) when `DATABASE_URL` is not used.

### Migration behavior

The Railway start command runs TypeORM migrations before starting NestJS:

```text
migration:run → node dist/main
```

If a migration fails, the API must not start. Never enable TypeORM `synchronize` in production.

### Health check

Configure Railway to use:

```text
GET /health
```

The endpoint returns success only when the API is running **and PostgreSQL responds to `SELECT 1`**.

## 4. Netlify frontend

Configure the frontend to use the deployed API through the repository's `/api` reverse-proxy configuration or the deployed API origin required by your hosting setup.

The application Axios client uses `/api/v1` as its runtime base path, so do not add an unused `VITE_API_URL` variable and assume it changes the runtime client.

For the Docker/Nginx deployment, `/api` is proxied to the API service.

If using Netlify, configure its `/api/*` redirect/proxy target to the actual Railway API URL. Replace the placeholder before deploying; do not commit placeholder production URLs.

## 5. CORS and cookies

Set Railway `FRONTEND_URL` to the exact HTTPS origin used by the frontend, for example:

```text
https://medlink.example.com
```

Do not add a trailing path. The API uses this value for credentialed CORS requests and refresh-token cookies.

## 6. Production verification

After both services deploy, run [`PRODUCTION-SMOKE-TEST.md`](./PRODUCTION-SMOKE-TEST.md).

At minimum verify:

- frontend loads over HTTPS;
- `/health` returns `200` with database status `ok`;
- deployment logs show migrations completed;
- login, refresh, browser reload, and logout work;
- authenticated WebSocket flows work;
- uploads reject invalid content;
- unauthenticated file retrieval is rejected.

## 7. Demo/seed data

Do not seed demo credentials into a production environment. If seed data is required for a staging environment, use staging-only accounts and passwords and keep them out of public documentation.

## 8. Rollback

Before applying a release:

1. Confirm the database backup/restore procedure is available.
2. Review pending migrations.
3. Deploy the API image.
4. Confirm migrations succeed.
5. Run the smoke test.
6. If the release is unhealthy, roll back the application image and follow the database migration rollback procedure appropriate for the migration that was deployed.

Do not manually edit production schema to repair a failed migration.
