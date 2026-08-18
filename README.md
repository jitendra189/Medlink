<div align="center">

# 🏥 MedLink

**Healthcare Emergency Response Platform**

Connecting patients with hospitals, blood donors, and ambulance drivers in real-time

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![NestJS](https://img.shields.io/badge/NestJS-10-E0234E?logo=nestjs&logoColor=white)](https://nestjs.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://postgresql.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4-black?logo=socket.io)](https://socket.io)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://docker.com)

[🌐 Live Demo](https://YOUR_NETLIFY_URL)

</div>

---

## Overview

MedLink is a healthcare emergency response platform built as a TypeScript monorepo. It connects patients with hospitals, blood donors, and ambulance drivers in real time.

| Role | What they can do |
|------|-----------------|
| 🏥 **Hospital Admin** | Manage ICU beds, doctors, incoming emergencies, bookings, and resources live |
| 🧑 **Patient** | Send SOS alerts with GPS, find hospitals, book doctors, request blood, track ambulances |
| 🩸 **Blood Donor** | Toggle availability, receive matching blood request alerts, fulfill requests |
| 🚑 **Ambulance Driver** | Go on duty, share live GPS location, accept emergency dispatches |

## Architecture

```text
Browser → Netlify (React SPA)
              ↓ REST + WebSocket
         Railway (NestJS API)
              ↓ TypeORM
         Railway (PostgreSQL 16)
```

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, React Query v5, Zustand, React Router v6, Socket.IO client |
| **Backend** | NestJS 10, TypeScript, TypeORM, PostgreSQL 16, Socket.IO, Passport JWT, bcryptjs, class-validator, Multer, Swagger/OpenAPI |
| **DevOps** | Docker + Docker Compose, GitHub Actions CI/CD, Turborepo, pnpm workspaces |
| **Deployment** | Netlify (frontend), Railway (API + PostgreSQL) |

## Security Highlights

- JWT access tokens are held in browser memory; refresh tokens use secure HttpOnly cookies.
- Refresh-token rotation and session revocation are enforced server-side.
- Password-reset tokens are hashed at rest and invalidate sessions after reset.
- Role-based authorization and ownership checks protect sensitive operations.
- Uploads require authentication, validated MIME/extension metadata, and binary signatures.
- WebSocket connections revalidate the current user and role and use minimized event payloads.
- Production configuration fails fast when required secrets or HTTPS frontend configuration is missing.
- Production PostgreSQL TLS certificate verification is enabled.
- Production schema changes use TypeORM migrations rather than `synchronize`.

## Quick Start

See [`docs/LOCAL-SETUP.md`](docs/LOCAL-SETUP.md) for local development.

```bash
git clone https://github.com/jitendra189/Medlink.git
cd Medlink
pnpm install
cp .env.example .env
# Configure .env, then build the monorepo
pnpm build
# Start PostgreSQL and run the API migrations before starting the API
pnpm --filter @medlink/api migration:run
pnpm --filter @medlink/api start
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| API | http://localhost:3000 |
| Health | http://localhost:3000/health |
| Swagger Docs | http://localhost:3000/api/docs (development only) |

## API Documentation

Swagger/OpenAPI is enabled in **development only** at `/api/docs`. Production deployments intentionally do not expose Swagger.

## Environment Variables

```bash
DATABASE_URL=
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=medlink
DATABASE_USER=medlink_user
DATABASE_PASSWORD=

PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

JWT_SECRET=
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY_DAYS=7

VITE_GOOGLE_MAPS_API_KEY=
```

For production, use a strong 64+ character `JWT_SECRET`, an HTTPS `FRONTEND_URL`, and either `DATABASE_URL` or all required discrete database variables. Never commit real secrets.

## Deployment

See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) and [`docs/PRODUCTION-SMOKE-TEST.md`](docs/PRODUCTION-SMOKE-TEST.md).

The deployment process runs database migrations before starting the API. The Railway health check uses `/health`, which verifies database connectivity.

## CI/CD

Every pull request and push covered by the workflow must pass:

1. **Lint**
2. **Typecheck**
3. **Shared package build**
4. **Database migration smoke test**
5. **Test**
6. **Production build**

A green CI run is necessary but is not by itself a production deployment approval; follow the production smoke-test runbook after deployment.

---

<div align="center">

Built by [jitendra189](https://github.com/jitendra189)

</div>
