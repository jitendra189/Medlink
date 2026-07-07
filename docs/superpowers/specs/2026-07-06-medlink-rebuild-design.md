# MedLink — Production Rebuild Design Spec

**Date:** 2026-07-06  
**Author:** jitendra189  
**Status:** Approved

---

## 1. Project Overview

MedLink is a healthcare emergency response and resource management platform that connects patients, hospitals, blood donors, and ambulance drivers in real-time. The goal of this rebuild is to transform the existing hackathon prototype into a production-grade, fully deployed project suitable for showcasing to companies as evidence of senior-level engineering capability.

### Goals
- Clean, maintainable, fully TypeScript codebase end-to-end
- All features fully implemented (no stubs, no hardcoded data)
- Production-grade infrastructure: Docker, CI/CD, Swagger docs, tests
- Live deployment visible on GitHub
- Impressive to senior engineers reviewing the repository

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS, React Query, Zustand, Socket.IO client |
| Backend | NestJS, TypeScript, TypeORM, PostgreSQL, Socket.IO, Passport JWT |
| Database | PostgreSQL (with PostGIS for geospatial queries) |
| Shared | `packages/shared` — TypeScript interfaces, DTOs, enums, constants |
| Maps | Google Maps JavaScript SDK |
| Auth | JWT access tokens + refresh tokens (httpOnly cookies) |
| Testing | Jest, Supertest (integration), React Testing Library (frontend) |
| DevOps | Docker, Docker Compose, GitHub Actions CI/CD |
| Docs | Swagger/OpenAPI (auto-generated from NestJS decorators) |
| Deployment | Frontend → Vercel, Backend + DB → Railway |
| Monorepo | Turborepo |

---

## 3. Repository Structure

```
medlink/                          # Turborepo monorepo root
├── apps/
│   ├── web/                      # React 18 + Vite frontend
│   │   ├── src/
│   │   │   ├── components/       # Reusable UI components
│   │   │   ├── pages/            # Route-level page components
│   │   │   │   ├── auth/         # Login, Register
│   │   │   │   ├── patient/      # Patient dashboard & sub-pages
│   │   │   │   ├── hospital/     # Hospital admin dashboard
│   │   │   │   ├── donor/        # Blood donor dashboard
│   │   │   │   └── driver/       # Ambulance driver dashboard
│   │   │   ├── hooks/            # Custom React hooks
│   │   │   ├── stores/           # Zustand global state stores
│   │   │   ├── services/         # API call functions (React Query)
│   │   │   ├── socket/           # Socket.IO client setup
│   │   │   └── utils/            # Helpers, constants, formatters
│   │   └── package.json
│   └── api/                      # NestJS backend
│       ├── src/
│       │   ├── auth/             # Auth module (register, login, refresh, guards)
│       │   ├── users/            # User module
│       │   ├── hospitals/        # Hospital module
│       │   ├── blood-donors/     # Blood donor module
│       │   ├── ambulance/        # Ambulance driver module
│       │   ├── emergency/        # Emergency request module
│       │   ├── blood-requests/   # Blood request module
│       │   ├── bookings/         # Doctor/ICU booking module
│       │   ├── doctors/          # Doctor module
│       │   ├── prescriptions/    # Prescription module
│       │   ├── notifications/    # Notification module
│       │   ├── gateways/         # Socket.IO WebSocket gateways
│       │   ├── database/         # TypeORM entities, migrations, seeds
│       │   └── common/           # Shared pipes, guards, interceptors, filters
│       └── package.json
├── packages/
│   └── shared/                   # Shared TypeScript package
│       ├── src/
│       │   ├── types/            # Shared interfaces and types
│       │   ├── dtos/             # Data transfer objects (used by both apps)
│       │   ├── enums/            # Role, status, blood group enums
│       │   └── constants/        # App-wide constants
│       └── package.json
├── docker-compose.yml            # PostgreSQL + API + Web (local dev)
├── docker-compose.prod.yml       # Production compose config
├── turbo.json                    # Turborepo pipeline config
├── .github/
│   └── workflows/
│       ├── ci.yml                # Run tests on every PR/push
│       └── deploy.yml            # Deploy on merge to main
├── .env.example                  # Environment variable template
├── .gitignore
└── README.md                     # Setup instructions, architecture overview, live demo link
```

---

## 4. Database Schema (PostgreSQL)

### Core Tables

#### `users`
```
id             uuid PK
name           varchar(100) NOT NULL
email          varchar(255) UNIQUE NOT NULL
password_hash  varchar NOT NULL
role           enum(patient | hospital | donor | driver) NOT NULL
phone          varchar(15)
avatar_url     varchar
is_active      boolean DEFAULT true
created_at     timestamp
updated_at     timestamp
```

#### `hospitals`
```
id                  uuid PK
user_id             uuid FK → users.id (UNIQUE — one hospital per user)
name                varchar(200) NOT NULL
address             text
city                varchar(100)
state               varchar(100)
phone               varchar(15)
latitude            decimal(9,6)
longitude           decimal(9,6)
icu_beds_total      int DEFAULT 0
icu_beds_available  int DEFAULT 0
total_doctors       int DEFAULT 0
ambulances_total    int DEFAULT 0
ambulances_available int DEFAULT 0
rating              decimal(2,1) DEFAULT 4.0
photo_url           varchar
created_at          timestamp
updated_at          timestamp
```

#### `blood_donors`
```
id               uuid PK
user_id          uuid FK → users.id (UNIQUE)
blood_group      enum(A+ | A- | B+ | B- | AB+ | AB- | O+ | O-) NOT NULL
city             varchar(100)
latitude         decimal(9,6)
longitude        decimal(9,6)
is_available     boolean DEFAULT true
last_donated_at  timestamp
total_donations  int DEFAULT 0
created_at       timestamp
updated_at       timestamp
```

#### `ambulance_drivers`
```
id                uuid PK
user_id           uuid FK → users.id (UNIQUE)
hospital_id       uuid FK → hospitals.id (nullable — independent drivers allowed)
vehicle_number    varchar(20)
is_on_duty        boolean DEFAULT false
latitude          decimal(9,6)
longitude         decimal(9,6)
last_location_at  timestamp
created_at        timestamp
updated_at        timestamp
```

### Operations Tables

#### `emergency_requests`
```
id           uuid PK
patient_id   uuid FK → users.id
hospital_id  uuid FK → hospitals.id (nullable — assigned on accept)
driver_id    uuid FK → ambulance_drivers.id (nullable — assigned on dispatch)
type         enum(icu | ambulance | general) NOT NULL
status       enum(pending | accepted | rejected | cancelled | resolved) DEFAULT pending
patient_lat  decimal(9,6)
patient_lng  decimal(9,6)
description  text
resolved_at  timestamp
created_at   timestamp
updated_at   timestamp
```

#### `blood_requests`
```
id              uuid PK
patient_id      uuid FK → users.id
donor_id        uuid FK → blood_donors.id (nullable — assigned on fulfillment)
hospital_id     uuid FK → hospitals.id (nullable)
blood_group     enum(A+ | A- | B+ | B- | AB+ | AB- | O+ | O-) NOT NULL
status          enum(pending | fulfilled | cancelled) DEFAULT pending
units_required  int DEFAULT 1
urgency         enum(low | medium | critical) DEFAULT medium
created_at      timestamp
updated_at      timestamp
```

#### `bookings`
```
id            uuid PK
patient_id    uuid FK → users.id
doctor_id     uuid FK → doctors.id
hospital_id   uuid FK → hospitals.id
type          enum(doctor | icu) NOT NULL
status        enum(pending | confirmed | cancelled | completed) DEFAULT pending
scheduled_at  timestamp NOT NULL
notes         text
created_at    timestamp
updated_at    timestamp
```

#### `prescriptions`
```
id          uuid PK
patient_id  uuid FK → users.id
doctor_id   uuid FK → doctors.id
booking_id  uuid FK → bookings.id (nullable)
diagnosis   text
medications jsonb  -- [{ name, dose, frequency, duration }]
notes       text
created_at  timestamp
```

### Supporting Tables

#### `doctors`
```
id           uuid PK
hospital_id  uuid FK → hospitals.id
name         varchar(100) NOT NULL
speciality   varchar(100)
phone        varchar(15)
is_available boolean DEFAULT true
created_at   timestamp
updated_at   timestamp
```

#### `notifications`
```
id            uuid PK
user_id       uuid FK → users.id
type          enum(emergency | blood | booking | system) NOT NULL
title         varchar(200)
message       text
is_read       boolean DEFAULT false
reference_id  uuid (nullable — points to related entity)
created_at    timestamp
```

#### `refresh_tokens`
```
id          uuid PK
user_id     uuid FK → users.id
token       varchar UNIQUE NOT NULL
expires_at  timestamp NOT NULL
is_revoked  boolean DEFAULT false
created_at  timestamp
```

---

## 5. API Design (NestJS Modules)

All endpoints are prefixed `/api/v1`. Auth-protected endpoints require `Authorization: Bearer <token>` header. Role guards enforce role-based access.

### Auth — `/api/v1/auth`
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/register` | Public | Register new user (any role) |
| POST | `/login` | Public | Login, returns access + refresh tokens |
| POST | `/refresh` | Public | Refresh access token |
| POST | `/logout` | Auth | Revoke refresh token |
| GET | `/me` | Auth | Get current user profile |

### Hospitals — `/api/v1/hospitals`
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/` | Auth | List all hospitals (with filters: city, icu_available) |
| GET | `/nearby` | Auth | Get hospitals within radius (lat, lng, radius_km) |
| GET | `/:id` | Auth | Get hospital details |
| GET | `/:id/doctors` | Auth | Get hospital's doctor list |
| GET | `/:id/resources` | Auth | Get hospital resource availability |
| PUT | `/resources` | Hospital | Update hospital resources (ICU, ambulances, doctors) |
| GET | `/dashboard` | Hospital | Hospital admin dashboard stats |

### Emergency — `/api/v1/emergency`
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/` | Patient | Create emergency request (SOS) |
| GET | `/` | Hospital | Get all pending emergency requests |
| GET | `/my` | Patient | Get patient's own emergency history |
| PUT | `/:id/accept` | Hospital | Accept emergency request |
| PUT | `/:id/reject` | Hospital | Reject emergency request |
| PUT | `/:id/cancel` | Patient | Cancel emergency request |
| PUT | `/:id/resolve` | Hospital | Mark emergency as resolved |

### Blood — `/api/v1/blood`
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/donors` | Auth | Search donors (blood_group, city, lat, lng) |
| POST | `/requests` | Patient | Create blood request |
| GET | `/requests/my` | Patient | Get patient's blood requests |
| GET | `/requests/pending` | Donor | Get pending blood requests near donor |
| PUT | `/requests/:id/fulfill` | Donor | Mark blood request as fulfilled |
| PUT | `/requests/:id/cancel` | Patient | Cancel blood request |
| GET | `/dashboard` | Donor | Donor dashboard stats |
| PUT | `/availability` | Donor | Toggle donor availability |

### Bookings — `/api/v1/bookings`
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/` | Patient | Create booking (doctor or ICU) |
| GET | `/my` | Patient | Patient's booking history |
| GET | `/hospital` | Hospital | Hospital's incoming bookings |
| PUT | `/:id/confirm` | Hospital | Confirm booking |
| PUT | `/:id/cancel` | Patient/Hospital | Cancel booking |
| PUT | `/:id/complete` | Hospital | Mark booking as completed |

### Prescriptions — `/api/v1/prescriptions`
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/` | Hospital | Create prescription for patient |
| GET | `/my` | Patient | Patient's prescription history |
| GET | `/:id` | Patient/Hospital | Get prescription details |

### Ambulance — `/api/v1/ambulance`
| Method | Endpoint | Access | Description |
|---|---|---|---|
| PUT | `/duty` | Driver | Toggle on-duty status |
| PUT | `/location` | Driver | Update driver live location |
| GET | `/requests` | Driver | Get pending emergency requests near driver |
| PUT | `/requests/:id/accept` | Driver | Accept dispatch request |
| GET | `/track/:driverId` | Patient | Get live driver location (for tracking) |

### Notifications — `/api/v1/notifications`
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/` | Auth | Get user's notifications |
| PUT | `/:id/read` | Auth | Mark notification as read |
| PUT | `/read-all` | Auth | Mark all as read |

### Doctors — `/api/v1/doctors`
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/` | Hospital | Add doctor to hospital |
| PUT | `/:id` | Hospital | Update doctor details |
| DELETE | `/:id` | Hospital | Remove doctor |

---

## 6. Real-time Events (Socket.IO WebSocket Gateway)

### Connection
- Client connects with JWT token in handshake auth: `{ token: "<access_token>" }`
- Server validates token and joins user to role-specific rooms:
  - Patient: `patient:<userId>`
  - Hospital: `hospital:<hospitalId>`
  - Driver: `driver:<driverId>`
  - All hospitals: `hospitals` (broadcast room)
  - All available donors: `donors` (broadcast room)

### Events

| Event | Direction | Payload | Description |
|---|---|---|---|
| `emergency:new` | Server → hospitals room | EmergencyRequest | New SOS from patient, broadcast to all hospital admins |
| `emergency:updated` | Server → patient room | EmergencyRequest | Status change (accepted/rejected) sent to patient |
| `emergency:driver_dispatched` | Server → patient room | DriverLocation | Ambulance driver assigned and en route |
| `blood:new_request` | Server → donors room | BloodRequest | New blood request, broadcast to matching available donors |
| `blood:request_fulfilled` | Server → patient room | BloodRequest | Donor accepted blood request |
| `driver:location_update` | Client → Server | { lat, lng } | Driver sends live location (on-duty only) |
| `driver:location_broadcast` | Server → patient room | { lat, lng } | Relayed to patient tracking the ambulance |
| `hospital:resource_update` | Server → all clients | HospitalResources | Hospital updates ICU/ambulance counts |
| `notification:new` | Server → user room | Notification | Push any in-app notification to user |

---

## 7. Frontend Pages & Navigation

### Public Routes
- `/` — Landing page (features, CTA, stats)
- `/login` — Role-based login
- `/register` — Registration (select role: patient/hospital/donor/driver)

### Patient Routes (protected, role: patient)
- `/patient/dashboard` — Stats, quick actions (SOS, blood request), nearby hospitals
- `/patient/hospitals` — Hospital list with search/filter
- `/patient/hospitals/:id` — Hospital detail page (resources, doctors, book)
- `/patient/icu-finder` — ICU bed availability map
- `/patient/blood` — Blood request form + donor search
- `/patient/emergency` — SOS button, active emergency status, ambulance tracking
- `/patient/bookings` — Booking history + new booking
- `/patient/prescriptions` — Prescription history
- `/patient/profile` — Edit profile

### Hospital Admin Routes (protected, role: hospital)
- `/hospital/dashboard` — Live stats, emergency queue, resource overview
- `/hospital/emergencies` — Full emergency request management
- `/hospital/bookings` — Incoming booking requests management
- `/hospital/doctors` — Doctor list management (add/edit/remove)
- `/hospital/resources` — Resource update form (ICU, ambulances, doctors)
- `/hospital/profile` — Hospital profile edit

### Blood Donor Routes (protected, role: donor)
- `/donor/dashboard` — Stats (donations, lives saved), blood request alerts
- `/donor/requests` — Pending blood requests nearby
- `/donor/history` — Donation history
- `/donor/profile` — Profile + availability toggle

### Ambulance Driver Routes (protected, role: driver)
- `/driver/dashboard` — On-duty toggle, active request, live map
- `/driver/requests` — Pending emergency requests near driver
- `/driver/history` — Trip history
- `/driver/profile` — Profile edit

---

## 8. Authentication & Security

- **JWT access tokens**: 15-minute expiry (short-lived for security)
- **Refresh tokens**: 7-day expiry, stored in httpOnly cookie (XSS-proof)
- **Password hashing**: bcrypt with salt rounds = 12
- **Role guards**: NestJS `@Roles()` decorator + `RolesGuard` on all protected endpoints
- **Input validation**: NestJS `ValidationPipe` with class-validator DTOs on every endpoint
- **Rate limiting**: `@nestjs/throttler` — 100 requests per minute per IP; 10 per minute for auth endpoints
- **CORS**: Restricted to known frontend origin (not `*`)
- **Helmet**: HTTP security headers via `@nestjs/helmet`
- **Environment secrets**: All secrets in `.env`, never committed (`.env.example` committed instead)

---

## 9. Testing Strategy

### Backend (NestJS)
- **Unit tests**: Each service class tested in isolation with mocked repositories
- **Integration tests**: Each module's controllers tested end-to-end against a real test PostgreSQL database (spun up via Docker in CI)
- **Coverage target**: ≥ 80% line coverage

### Frontend (React)
- **Component tests**: React Testing Library for key UI components
- **Hook tests**: Custom hooks tested with `renderHook`
- **Coverage target**: ≥ 70% line coverage

### CI enforcement
- GitHub Actions runs all tests on every push and PR
- Build fails if coverage drops below threshold

---

## 10. CI/CD Pipeline (GitHub Actions)

### `ci.yml` — triggers on: push to any branch, PR to main
1. Checkout code
2. Install dependencies (`turbo install`)
3. Run lint (`turbo lint`)
4. Run type check (`turbo typecheck`)
5. Run tests (`turbo test`) — spins up PostgreSQL service container
6. Build all apps (`turbo build`)
7. Report coverage

### `deploy.yml` — triggers on: merge to main
1. Run CI pipeline (above)
2. Build Docker images for `api`
3. Push images to GitHub Container Registry (GHCR)
4. Deploy `api` to Railway via Railway CLI
5. Deploy `web` to Vercel via Vercel CLI

---

## 11. Docker Setup

### `docker-compose.yml` (local dev)
```yaml
services:
  postgres:
    image: postgres:16
    ports: ["5432:5432"]
    environment: POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD
    volumes: postgres_data:/var/lib/postgresql/data

  api:
    build: ./apps/api
    ports: ["3000:3000"]
    depends_on: [postgres]
    env_file: .env

  web:
    build: ./apps/web
    ports: ["5173:5173"]
    depends_on: [api]
```

One command to run everything locally: `docker-compose up`

---

## 12. Feature Completeness Checklist

### Authentication
- [x] Register (patient / hospital / donor / driver)
- [x] Login with JWT + refresh token
- [x] Role-based route protection
- [x] Auth guards on all protected endpoints

### Patient Features
- [x] Dashboard with live stats
- [x] Hospital search (by city, name, ICU availability)
- [x] Nearby hospitals on map
- [x] Hospital detail page with resources and doctors
- [x] ICU bed finder
- [x] Emergency SOS with GPS location
- [x] Real-time ambulance tracking after SOS accepted
- [x] Blood request creation and donor search
- [x] Doctor appointment booking
- [x] ICU booking
- [x] Prescription history view
- [x] Emergency request history
- [x] Profile management

### Hospital Admin Features
- [x] Dashboard with live stats
- [x] Emergency request queue (accept/reject/resolve)
- [x] Resource management (ICU, ambulances, doctors)
- [x] Doctor management (add/edit/remove)
- [x] Incoming bookings management
- [x] Issue prescriptions to patients
- [x] Real-time emergency alerts via WebSocket
- [x] Hospital profile management

### Blood Donor Features
- [x] Donor dashboard with stats
- [x] Availability toggle
- [x] Real-time blood request alerts (matching blood group)
- [x] Accept/fulfill blood requests
- [x] Donation history
- [x] Profile management

### Ambulance Driver Features
- [x] On-duty toggle
- [x] Live location sharing via WebSocket
- [x] Pending emergency requests queue (nearby)
- [x] Accept and navigate to patient (Google Maps)
- [x] Trip history
- [x] Profile management

### Infrastructure
- [x] Swagger/OpenAPI docs at `/api/docs`
- [x] Docker Compose local dev setup
- [x] GitHub Actions CI (test + build on every push)
- [x] GitHub Actions CD (deploy on merge to main)
- [x] Full test suite (unit + integration)
- [x] Environment variable template (`.env.example`)
- [x] README with setup instructions + live demo link

---

## 13. Seed Data

The database seed (`apps/api/src/database/seeds/`) will populate:
- 5 hospitals across major Indian cities (Mumbai, Delhi, Bangalore, Chennai, Hyderabad) with realistic resource counts and geo-coordinates
- 10 patient users
- 8 blood donors with varied blood groups and availability
- 4 ambulance drivers (2 on duty)
- 15 doctors spread across hospitals with specialities
- Sample emergency requests, bookings, blood requests, and prescriptions in various states
- All users with password: `Test@12345` (shown in README for demo purposes)

---

## 14. README Structure

The GitHub README will include:
1. Project banner/screenshot
2. Live demo link (Vercel URL)
3. Tech stack badges
4. Architecture diagram
5. Feature list by role
6. Quick start (Docker Compose)
7. Environment variables reference
8. API docs link (Swagger)
9. Test instructions
10. Deployment guide
