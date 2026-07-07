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

[🌐 Live Demo](https://YOUR_NETLIFY_URL) · [📄 API Docs](https://YOUR_RAILWAY_URL/api/docs)

</div>

---

## Overview

MedLink is a **production-grade healthcare emergency platform** built to demonstrate full-stack engineering capability at scale. It connects four types of users in real-time across a modern TypeScript monorepo.

| Role | What they can do |
|------|-----------------|
| 🏥 **Hospital Admin** | Manage ICU beds, doctors, incoming emergencies, bookings, and resources live |
| 🧑 **Patient** | Send SOS alerts with GPS, find hospitals, book doctors, request blood, track ambulances |
| 🩸 **Blood Donor** | Toggle availability, receive matching blood request alerts, fulfill requests |
| 🚑 **Ambulance Driver** | Go on duty, share live GPS location every 5 seconds, accept emergency dispatches |

---

## Architecture

```
medlink/                          ← Turborepo monorepo (pnpm workspaces)
├── apps/
│   ├── web/                      ← React 18 + Vite + TypeScript + Tailwind CSS
│   └── api/                      ← NestJS + TypeORM + PostgreSQL + Socket.IO
└── packages/
    └── shared/                   ← Shared TypeScript types, enums, constants
```

```
Browser → Netlify (React SPA)
              ↓ REST + WebSocket
         Railway (NestJS API)
              ↓ TypeORM
         Railway (PostgreSQL 16)
```

---

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, React Query v5, Zustand, React Router v6, Socket.IO client, React Hook Form + Zod |
| **Backend** | NestJS 10, TypeScript, TypeORM, PostgreSQL 16, Socket.IO, Passport JWT, bcryptjs, class-validator, Multer, Swagger/OpenAPI |
| **DevOps** | Docker + Docker Compose, GitHub Actions CI/CD, Turborepo, pnpm workspaces |
| **Deployment** | Netlify (frontend), Railway (API + PostgreSQL) |

---

## Key Features

### ⚡ Real-time Emergency System
- Patient sends SOS with live GPS coordinates
- Socket.IO broadcasts instantly to all connected hospital admins
- Hospital accepts → patient sees status update in real-time (no refresh)
- Ambulance driver assigned → patient tracks live location on map every 5 seconds

### 🩸 Blood Donation Network
- Patients create blood requests with blood group and urgency level
- Available donors matching the blood type receive instant Socket.IO alerts
- Full donation history and lives-saved tracking per donor

### 🏥 Hospital Resource Management
- ICU beds, ambulances, and doctor counts updated in real-time
- Geospatial queries find nearest hospitals with available ICU beds
- Complete booking and prescription management system

### 🔐 Production-Grade Security
- JWT access tokens (15 min) + httpOnly refresh token cookies (7 days)
- Token rotation on every refresh, all sessions revoked on password reset
- bcrypt password hashing, rate limiting, CORS, Helmet security headers
- Role-based access control on every endpoint

### 📁 File Uploads
- Profile photo upload with live preview (JPEG/PNG/GIF, max 2MB)
- Prescription document attachments (PDF/images, max 5MB)

### 🔑 Password Recovery
- Forgot password flow with secure 32-byte hex tokens (1h expiry)
- Full token invalidation on password reset + session revocation

---

## Quick Start

> **New to the project?** See the full step-by-step guide: [docs/LOCAL-SETUP.md](docs/LOCAL-SETUP.md)

### Prerequisites
- Node.js 20+, pnpm 9+, Docker Desktop

```bash
# 1. Clone the repository
git clone https://github.com/jitendra189/Medlink.git
cd Medlink

# 2. Install dependencies
pnpm install

# 3. Copy and configure environment
cp .env.example .env
# Edit .env — set a strong JWT_SECRET (64+ chars)

# 4. Start PostgreSQL
docker-compose up postgres -d

# 5. Start the API (from repo root)
node apps/api/dist/main &

# 6. Seed the database
cd apps/api && pnpm seed

# 7. Start the frontend
cd apps/web && pnpm dev
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| API | http://localhost:3000 |
| Swagger Docs | http://localhost:3000/api/docs |

---

## Demo Accounts

All demo accounts use password: **`Test@12345`**

| Role | Email |
|------|-------|
| Patient | amit@medlink.demo |
| Hospital Admin | apollo_hospital@medlink.demo |
| Blood Donor | kiran@medlink.demo |
| Ambulance Driver | driver1@medlink.demo |

---

## API Documentation

Full interactive Swagger/OpenAPI docs at `/api/docs`.

**47 REST endpoints across 9 modules:**

```
POST   /api/v1/auth/register          Register as any role
POST   /api/v1/auth/login             Login → JWT access token
POST   /api/v1/auth/forgot-password   Request password reset
POST   /api/v1/auth/reset-password    Reset with token
GET    /api/v1/hospitals              List hospitals (paginated)
GET    /api/v1/hospitals/nearby       Nearest hospitals by GPS
POST   /api/v1/emergency              Create SOS emergency
PUT    /api/v1/emergency/:id/accept   Hospital accepts SOS
GET    /api/v1/blood/donors           Search donors (paginated)
POST   /api/v1/blood/requests         Create blood request
PUT    /api/v1/ambulance/location     Driver updates live GPS
POST   /api/v1/uploads/avatar         Upload profile photo
...and 35 more
```

---

## WebSocket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `emergency:new` | Server → Hospital | New SOS emergency arrived |
| `emergency:updated` | Server → Patient | Emergency status changed |
| `blood:new_request` | Server → Donors | New blood request matching type |
| `ambulance:location_update` | Driver → Server → Patient | Live GPS position |
| `hospital:resources_updated` | Server → All | ICU/ambulance count changed |

---

## Project Structure

```
apps/api/src/
├── auth/            JWT auth, strategies, guards, decorators
├── users/           User management + avatar upload
├── hospitals/       Search, resources, geospatial queries
├── doctors/         Doctor management per hospital
├── emergency/       SOS request lifecycle
├── blood/           Donor search + blood request flow
├── bookings/        Doctor/ICU appointment system
├── prescriptions/   Prescription management + file attachments
├── ambulance/       Driver duty + live location updates
├── notifications/   In-app notification system
├── gateways/        Socket.IO WebSocket gateway
├── uploads/         Multer file upload handling
└── database/
    ├── entities/    11 TypeORM entities
    ├── migrations/  Database migration files
    └── seeds/       Realistic Indian seed data

apps/web/src/
├── pages/           26 route-level components
│   ├── auth/        Landing, Login, Register, ForgotPassword, ResetPassword
│   ├── patient/     9 patient pages
│   ├── hospital/    6 hospital admin pages
│   ├── donor/       4 blood donor pages
│   └── driver/      4 ambulance driver pages
├── components/      Reusable UI + layout components
├── services/        API call functions (one per backend module)
├── stores/          Zustand global state (auth)
├── lib/             Axios, React Query, Socket.IO configuration
└── router/          React Router v6 + role-based protected routes
```

---

## Running Tests

```bash
# All tests (API + frontend)
pnpm turbo test

# API only (34 tests, 8 suites)
cd apps/api && pnpm test

# With coverage report
cd apps/api && pnpm test -- --coverage
```

---

## Environment Variables

```bash
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=medlink
DATABASE_USER=medlink_user
DATABASE_PASSWORD=medlink_pass

# API
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# JWT (use 64+ random chars in production)
JWT_SECRET=your_jwt_secret_here
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY_DAYS=7

# Google Maps (frontend — optional for map features)
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

---

## Deployment

See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for the complete step-by-step deployment guide.

| Service | Platform | URL |
|---------|----------|-----|
| Frontend | Netlify | https://YOUR_NETLIFY_URL |
| API | Railway | https://YOUR_RAILWAY_URL |
| PostgreSQL | Railway | (managed, internal) |

---

## CI/CD Pipeline (GitHub Actions)

Every push to `main` triggers:

1. **Lint** — ESLint across all packages
2. **Typecheck** — TypeScript strict mode across all packages
3. **Test** — Jest (API) + Vitest (frontend) with PostgreSQL service container
4. **Build** — Production builds verified for both apps

---

<div align="center">

Built by [jitendra189](https://github.com/jitendra189) · Healthcare emergency platform showcasing production-grade TypeScript full-stack engineering

</div>
