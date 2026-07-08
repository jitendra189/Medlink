# MedLink — Complete Interview Resource Note

> This document covers everything about the MedLink project from idea to deployment.
> Use this to prepare for any interview question about this project.

---

## Table of Contents

1. [The Original Idea](#1-the-original-idea)
2. [The Problem We Are Solving](#2-the-problem-we-are-solving)
3. [Planning — How We Designed It](#3-planning--how-we-designed-it)
4. [Tech Stack Decisions — What We Chose and Why](#4-tech-stack-decisions--what-we-chose-and-why)
5. [What We Decided NOT to Build and Why](#5-what-we-decided-not-to-build-and-why)
6. [Architecture — How It Is Structured](#6-architecture--how-it-is-structured)
7. [Database Design — Why These Tables](#7-database-design--why-these-tables)
8. [Authentication and Security — How It Works](#8-authentication-and-security--how-it-works)
9. [Real-time Features — How Socket.IO Works](#9-real-time-features--how-socketio-works)
10. [The Four Roles — What Each Does](#10-the-four-roles--what-each-does)
11. [Key Features — How Each Was Built](#11-key-features--how-each-was-built)
12. [Frontend Architecture — How the UI Works](#12-frontend-architecture--how-the-ui-works)
13. [File Uploads — How It Works](#13-file-uploads--how-it-works)
14. [Pagination — Why and How](#14-pagination--why-and-how)
15. [Testing — What Was Tested and How](#15-testing--what-was-tested-and-how)
16. [DevOps — Docker, CI/CD, Monorepo](#16-devops--docker-cicd-monorepo)
17. [Deployment Plan — Railway and Netlify](#17-deployment-plan--railway-and-netlify)
18. [What Is Missing and Why](#18-what-is-missing-and-why)
19. [The Data — Where It Comes From](#19-the-data--where-it-comes-from)
20. [Challenges Faced During Development](#20-challenges-faced-during-development)
21. [Interview Questions and Answers](#21-interview-questions-and-answers)

---

## 1. The Original Idea

MedLink started as a **hackathon project** — a basic healthcare emergency platform built with plain HTML, CSS, JavaScript, Node.js/Express, and MongoDB. It worked end-to-end for the hackathon but had many issues:

- No tests at all
- Hardcoded doctor lists inside controllers
- Empty stub model files committed as if they were features
- JWT secret was `medlink_secret_key_2026` — a real security risk
- The ambulance module was a completely separate orphaned codebase
- No input validation, inconsistent route protection
- Multiple overlapping pages doing the same thing

The decision was made to **completely rebuild** MedLink from scratch as a production-grade portfolio project to demonstrate to companies what a properly engineered full-stack application looks like.

**The core idea remained the same:** Build a platform that connects four types of users in healthcare emergencies:
1. Patients who need help
2. Hospitals that provide help
3. Blood donors who save lives
4. Ambulance drivers who transport patients

---

## 2. The Problem We Are Solving

In India, during a medical emergency, a patient faces multiple disconnected problems:

- **Which hospital has ICU beds available?** There is no real-time visibility. You call around or just go and hope.
- **Where do I find blood of my type urgently?** You post on WhatsApp groups and pray someone responds.
- **How do I get an ambulance quickly?** You call a general number and wait.
- **How does the hospital know I'm coming?** They don't until you arrive.

MedLink solves all four problems on one platform:
- Real-time ICU bed visibility across all registered hospitals
- Blood donor network with instant alerts when a matching request is created
- Ambulance dispatch with live GPS tracking
- SOS alerts sent instantly to all nearby hospital admins

---

## 3. Planning — How We Designed It

Before writing a single line of code, a full design process was followed:

### Step 1: Requirements gathering
Seven key questions were answered to define scope:
1. **Which roles?** → Patient, Hospital Admin, Blood Donor, Ambulance Driver (4 roles)
2. **Purpose?** → Portfolio showcase for companies — looks and functions like production
3. **Frontend framework?** → React (modern, what companies expect in 2025)
4. **Backend framework?** → NestJS (TypeScript, decorators, enterprise-grade structure)
5. **Database?** → PostgreSQL (relational, typed, pairs well with NestJS)
6. **Production features?** → Tests, Docker, CI/CD, Swagger — all of them
7. **Feature completeness?** → Build all features fully, no stubs

### Step 2: Architecture decision
Three options were considered:
- Option A: Monorepo, single deployment (simple but coupled)
- **Option B: Turborepo monorepo (chosen)** — one repo, shared types, best structure
- Option C: Separate repositories (more DevOps overhead, harder to review)

**Why Turborepo?** It's how large companies actually structure full-stack monorepos. Shared TypeScript types between frontend and backend, one `docker-compose up` to run everything, shows understanding of modern tooling.

### Step 3: Full spec written
A 584-line design specification was written covering:
- Complete PostgreSQL schema (11 tables)
- All 47 REST API endpoints
- WebSocket event map
- All 26 frontend pages
- Auth/security design
- CI/CD pipeline design

### Step 4: Five implementation plans written
The work was broken into 5 sequential plans:
- **Plan 1:** Monorepo foundation + Docker + CI/CD
- **Plan 2:** Database entities + Auth (JWT, bcrypt, refresh tokens)
- **Plan 3:** All 8 feature modules + WebSocket gateway
- **Plan 4:** Complete React frontend (all 26 pages)
- **Plan 5:** Seed data + README + deployment configs

---

## 4. Tech Stack Decisions — What We Chose and Why

### Backend: NestJS (not Express)

**Why not Express?**
Express is unopinionated — you can structure code however you want. For a solo hackathon that's fine. But for a portfolio showing companies you can work in a team, NestJS is better because:
- Enforces a module/controller/service pattern everyone on a team follows
- TypeScript decorators (`@Controller`, `@Injectable`, `@Guard`) are how enterprise backends are written
- Built-in dependency injection — shows understanding of SOLID principles
- Auto-generates Swagger docs from code
- Guards, interceptors, pipes — all the patterns large companies use

**Why TypeScript throughout?**
- Catches errors at compile time not runtime
- Shared types between frontend and backend via `packages/shared` — if the API changes a field name, TypeScript immediately shows the error in the frontend
- Companies expect TypeScript in 2025

### Database: PostgreSQL (not MongoDB)

**Why not MongoDB (which the original used)?**
- Healthcare data is relational — a booking belongs to a patient, belongs to a doctor, belongs to a hospital. Foreign keys enforce this at the database level.
- Transactions are critical — if a booking is created but payment fails, you need to rollback. PostgreSQL handles this natively.
- Typed schemas — no surprise null fields or mismatched types
- Companies (especially in healthcare/finance) prefer relational databases

**Why TypeORM (not Prisma)?**
- TypeORM is the standard for NestJS
- Decorator-based entities match NestJS's decorator style
- `synchronize: true` in development auto-creates tables from entities — no migration hassle during development

### Frontend: React 18 + Vite (not Next.js)

**Why not Next.js?**
- Next.js adds SSR complexity that isn't needed for a dashboard-heavy app
- React + Vite is the most common stack companies hire for
- The backend is already a separate NestJS API — SSR from Next.js would add a third layer

**Why Vite (not Create React App)?**
- Vite starts in under 1 second, CRA takes 30+ seconds
- Native ES modules — faster development
- CRA is deprecated as of 2023

**Why React Query?**
- Replaces 15 lines of useState/useEffect/fetch boilerplate per page with 3 lines
- Built-in caching — navigate away and back, data is instant
- Background refetching — data stays fresh without manual polling

**Why Zustand (not Redux)?**
- Redux requires actions, reducers, dispatchers — massive boilerplate for simple auth state
- Zustand is 10 lines for the same result
- For auth state (user + token + isAuthenticated), Zustand is the right size tool

**Why Tailwind CSS?**
- No context switching between .tsx and .css files
- Utility classes are faster to write than custom CSS
- Consistent design system — every spacing, color, and size comes from the same scale
- Used by companies like GitHub, Vercel, Linear

### Real-time: Socket.IO (not plain WebSocket)

**Why not plain WebSocket?**
- Socket.IO adds rooms (you can broadcast to just hospital admins, not everyone)
- Automatic reconnection on disconnect
- Fallback to HTTP long-polling if WebSocket is blocked
- Event-based API is cleaner than raw message parsing

### Monorepo: Turborepo + pnpm workspaces

**Why Turborepo?**
- Parallel task execution across packages — `pnpm turbo build` builds shared → api → web in parallel where possible
- Build caching — if nothing changed, it returns cached results instantly
- Clear dependency graph — api depends on shared, web depends on shared

**Why pnpm (not npm or yarn)?**
- Symlinked node_modules — drastically less disk space
- Strict dependency resolution — can't accidentally use undeclared dependencies
- Native workspace support

---

## 5. What We Decided NOT to Build and Why

### Email delivery (Nodemailer/SendGrid)
**Left out because:** Setting up a real email service requires an account, API keys, and can be rate-limited during demos. The forgot password flow works — the reset link is logged to the API console for demo purposes.
**How to answer:** "The infrastructure is there — the token is generated and stored. Wiring up SendGrid would take 30 minutes and is documented as a next step."

### Google OAuth / Social Login
**Left out because:** Adds complexity (Passport Google strategy, callback URLs, different token format) without demonstrating new concepts. JWT auth already demonstrates authentication understanding.
**How to answer:** "Adding OAuth would use the same Passport.js pattern already implemented. The auth module is structured to support additional strategies."

### SMS OTP / 2FA
**Left out because:** Requires a paid Twilio account and phone number verification. Not necessary for portfolio demonstration.

### Admin/Super-Admin Panel
**Left out because:** Would require a 5th role, 5th dashboard, and significant additional backend work. The four main user flows already demonstrate the complete system.

### Payment Gateway
**Left out because:** MedLink is an emergency response platform — payments are not part of the emergency flow. Booking fees could be added as a feature but are outside the core value proposition.

### HIPAA/DPDP Compliance
**Left out because:** Legal compliance is beyond the scope of a portfolio project. In a real production system, compliance would be addressed with proper legal counsel.
**How to answer:** "For a real production deployment in India, we would need to comply with the Digital Personal Data Protection Act. This would involve consent management, data retention policies, audit trails, and the right to deletion — all of which are architecture-level decisions made from the start."

### Mobile App (React Native)
**Left out because:** The backend API is 100% ready for a mobile app. Building the mobile app would take the same amount of time as the web app again. The web app is responsive and works on mobile browsers.
**How to answer:** "The backend is platform-agnostic — a React Native app could call the exact same API. The `packages/shared` TypeScript types would even work in React Native since it's also TypeScript."

---

## 6. Architecture — How It Is Structured

```
medlink/                          ← Turborepo monorepo root
├── apps/
│   ├── api/                      ← NestJS backend
│   │   └── src/
│   │       ├── auth/             ← JWT auth, guards, strategies
│   │       ├── users/            ← User management
│   │       ├── hospitals/        ← Hospital search + resources
│   │       ├── doctors/          ← Doctor management
│   │       ├── emergency/        ← SOS emergency lifecycle
│   │       ├── blood/            ← Blood donation + requests
│   │       ├── bookings/         ← Doctor/ICU appointments
│   │       ├── prescriptions/    ← Prescription management
│   │       ├── ambulance/        ← Driver duty + GPS location
│   │       ├── notifications/    ← In-app notifications
│   │       ├── gateways/         ← Socket.IO WebSocket gateway
│   │       ├── uploads/          ← Multer file uploads
│   │       └── database/         ← TypeORM entities + seeds
│   └── web/                      ← React 18 frontend
│       └── src/
│           ├── pages/            ← 26 route-level page components
│           ├── components/       ← Reusable UI + layout components
│           ├── services/         ← API call functions
│           ├── stores/           ← Zustand global state
│           ├── lib/              ← Axios, React Query, Socket.IO
│           └── router/           ← React Router + protected routes
└── packages/
    └── shared/                   ← Shared TypeScript types/enums/constants
        └── src/
            ├── enums/            ← Role, BloodGroup, status enums
            ├── types/            ← IUser, IHospital, IEmergencyRequest
            └── constants/        ← SOCKET_EVENTS, API_PREFIX, BCRYPT_SALT_ROUNDS
```

### Why this structure?

**Separation of concerns:** Each feature (hospitals, emergency, blood) is its own NestJS module with its own controller, service, and DTOs. Adding a new feature means creating a new folder — nothing existing breaks.

**Shared package:** The `packages/shared` package is the single source of truth for types. If `IHospital` changes a field name, TypeScript immediately shows errors in both the API and the frontend. No drift.

**Module pattern:** Every NestJS module has:
- `*.controller.ts` — HTTP routes, input validation
- `*.service.ts` — business logic
- `*.dto.ts` — data transfer objects (what the API accepts/returns)
- `*.module.ts` — wires controller + service + database repository

---

## 7. Database Design — Why These Tables

The database has 11 tables:

### Core tables

**users** — all users regardless of role
- One table for all roles (patient, hospital, donor, driver)
- Role stored as an enum column
- Why? Simplifies auth — one JWT strategy handles all users

**hospitals** — hospital profiles
- Linked to a user (hospital admin) via `userId` (one-to-one)
- Stores ICU counts, ambulance counts, GPS coordinates, rating
- Why separate from users? Hospital metadata is large and role-specific

**blood_donors** — donor profiles
- Linked to user via `userId` (one-to-one)
- Stores blood group, city, GPS, availability, donation count

**ambulance_drivers** — driver profiles
- Linked to user and optionally to a hospital
- Stores vehicle number, duty status, live GPS coordinates

**doctors** — doctors per hospital
- Linked to hospital (many-to-one)
- Has speciality, phone, availability flag

### Transaction tables

**emergency_requests** — SOS emergency lifecycle
- Patient sends → status = pending
- Hospital accepts → status = accepted, hospitalId filled
- Driver assigned → driverId filled
- Hospital resolves → status = resolved

**blood_requests** — blood donation requests
- Created by patient with blood group + urgency
- Fulfilled by donor → donorId filled, status = fulfilled

**bookings** — doctor/ICU appointments
- Created by patient
- Confirmed/completed/cancelled by hospital

**prescriptions** — medical prescriptions
- Issued by hospital after booking
- Medications stored as JSONB array (flexible structure)

### System tables

**notifications** — in-app notifications
- Created whenever a key event happens (emergency accepted, booking confirmed)
- isRead flag for unread count in UI

**refresh_tokens** — JWT refresh token store
- Stores hashed refresh tokens with expiry
- isRevoked flag — can invalidate all sessions on password reset

**password_reset_tokens** — password reset
- Stores secure random token with 1-hour expiry
- isUsed flag — single-use enforcement

---

## 8. Authentication and Security — How It Works

### The Two-Token System

**Access Token (JWT):**
- Expires in 15 minutes
- Stored in memory (localStorage in current implementation)
- Sent in `Authorization: Bearer <token>` header on every API call
- Contains: userId, email, role

**Refresh Token:**
- Expires in 7 days
- Stored as httpOnly cookie (JavaScript cannot read it — XSS protection)
- Used only to get a new access token
- Rotated on every use (old token invalidated, new one issued)

**Why two tokens?**
If someone steals your access token, it expires in 15 minutes — limited damage. The refresh token in httpOnly cookie can't be stolen by JavaScript (XSS attack prevention).

### The Login Flow
```
1. User sends email + password
2. Server finds user by email
3. bcrypt.compare(password, storedHash) — verifies password
4. Generates JWT access token (15 min)
5. Generates refresh token → saves hashed version to DB
6. Returns: accessToken in response body, refreshToken in httpOnly cookie
```

### The Refresh Flow
```
1. Access token expires → API returns 401
2. Axios interceptor catches 401
3. Interceptor calls POST /auth/refresh (cookie sent automatically)
4. Server validates refresh token from cookie
5. Issues new access token + new refresh token (rotation)
6. Interceptor retries the original failed request
7. User never notices anything happened
```

### Password Hashing
- bcryptjs with 10 salt rounds
- 10 rounds = ~100ms per hash — slow enough to resist brute force, fast enough for UX
- Why 10 and not 12? 12 rounds = ~400ms — too slow for login. 10 is the industry standard default.

### Security Measures
- **Helmet.js** — sets secure HTTP headers (X-Frame-Options, X-Content-Type, etc.)
- **Rate limiting** — ThrottlerGuard limits requests per IP (prevents brute force)
- **CORS** — only allows requests from the configured FRONTEND_URL
- **ValidationPipe** — whitelist: true removes any fields not in the DTO (prevents injection via extra fields)
- **Email enumeration prevention** — forgot password always returns same message whether email exists or not

### JWT Guards
Two guards protect routes:
- `JwtAuthGuard` — verifies the JWT is valid and not expired
- `RolesGuard` — checks the user's role matches `@Roles(Role.HOSPITAL)` decorator

Example:
```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.HOSPITAL)
@Put('resources')
updateResources() { ... }
```
Only a logged-in Hospital Admin can call this endpoint.

---

## 9. Real-time Features — How Socket.IO Works

### Architecture
The WebSocket gateway (`MedlinkGateway`) is a NestJS class decorated with `@WebSocketGateway`.

When a user connects:
1. The client sends the JWT token in the `auth` object: `io('/', { auth: { token } })`
2. The gateway validates the token
3. Based on role, the user is joined to the appropriate room:
   - Patients → room `patient:<userId>`
   - Hospital admins → room `hospital:<hospitalId>`
   - Donors → room `donor:<userId>`
   - Drivers → room `driver:<userId>`

### The 5 Real-time Events

**1. `emergency:new`**
- **Trigger:** Patient sends SOS → EmergencyService creates the request → emits to `hospital` room
- **Who receives:** All connected hospital admins
- **What happens:** Hospital dashboard shows new emergency in the queue instantly

**2. `emergency:updated`**
- **Trigger:** Hospital accepts/rejects emergency → emits to `patient:<patientId>` room
- **Who receives:** The specific patient who sent the SOS
- **What happens:** Patient's emergency page updates status from pending → accepted

**3. `blood:new_request`**
- **Trigger:** Patient creates blood request → BloodService emits to `donor` room
- **Who receives:** All connected blood donors (frontend filters by blood group)
- **What happens:** Donor dashboard shows the new request instantly

**4. `driver:location_update`**
- **Trigger:** Driver dashboard sends GPS coordinates every 5 seconds via `socket.emit`
- **Who receives:** Server forwards to `patient:<patientId>` tracking that driver
- **What happens:** Patient can track ambulance location in real-time

**5. `hospital:resources_updated`**
- **Trigger:** Hospital admin updates ICU/ambulance counts
- **Who receives:** All connected patients
- **What happens:** Patient dashboard stats refresh

### Why Socket.IO over plain WebSocket?
- **Rooms** — broadcast to a group, not everyone (`socket.to('hospital:roomId').emit(...)`)
- **Auto-reconnect** — if connection drops, Socket.IO reconnects automatically
- **Fallback** — if WebSocket is blocked by a corporate firewall, falls back to HTTP long-polling
- **Event model** — named events (`emergency:new`) are cleaner than raw message strings

---

## 10. The Four Roles — What Each Does

### Patient
The primary end-user. A patient can:
- Send SOS emergency with GPS location
- Find hospitals near them with available ICU beds
- Request blood with urgency level
- Book appointments with doctors
- View prescriptions
- Track ambulance in real-time after dispatch
- Receive real-time status updates on emergencies

### Hospital Admin
Manages one hospital. Can:
- See live dashboard with ICU beds, ambulances, doctor counts
- Receive real-time emergency alerts from patients
- Accept or reject emergencies
- Dispatch ambulance drivers
- Manage doctors (add, remove, toggle availability)
- Confirm/complete/cancel patient bookings
- Issue prescriptions
- Update resource counts in real-time

### Blood Donor
Community member. Can:
- Toggle availability (available/unavailable)
- Receive instant alerts when a matching blood request is created
- Fulfill blood requests
- Track donation history and lives saved count

### Ambulance Driver
Associated with a hospital. Can:
- Toggle on-duty/off-duty status
- Share live GPS location every 5 seconds when on duty
- View nearby emergency requests
- Accept dispatches

---

## 11. Key Features — How Each Was Built

### Emergency SOS System

**Flow:**
```
Patient clicks SOS
  → Browser gets GPS (navigator.geolocation)
  → POST /emergency { type, patientLat, patientLng }
  → EmergencyService saves to DB with status=pending
  → Socket.IO emits emergency:new to hospital room
  → Hospital admin sees it instantly
  → Hospital clicks Accept
  → PUT /emergency/:id/accept
  → Status → accepted, hospitalId filled
  → Socket.IO emits emergency:updated to patient room
  → Patient sees status change in real-time
```

**Database design:** The emergency_requests table has nullable `hospitalId` and `driverId`. These get filled as the request progresses through its lifecycle.

### Blood Donor Network

**How blood group matching works:**
When a patient creates a blood request, the frontend filters the donor list by blood group. The backend doesn't do automatic matching — the patient chooses the blood group needed, and available donors of that type receive the alert.

**The lives saved counter:**
Each time a donor fulfills a request, `totalDonations` increments on `BloodDonorEntity`. The UI calculates `livesSaved` as `totalDonations` (one donation = one life saved — simplified for demo).

### Geospatial Hospital Search

**How nearby hospitals work:**
The `findNearby` method in HospitalsService uses the Haversine formula to calculate distance between two GPS coordinates:

```
distance = 2 * R * arcsin(sqrt(
  sin²((lat2-lat1)/2) +
  cos(lat1) * cos(lat2) * sin²((lng2-lng1)/2)
))
```

Where R = 6371 km (Earth's radius). Returns hospitals within the specified radius sorted by distance.

**Why not PostGIS?** PostGIS is the proper solution for geospatial queries in PostgreSQL but adds complexity. The Haversine formula in application code is sufficient for the scale of this demo.

### Booking System

**Booking lifecycle:**
- `pending` → hospital confirms → `confirmed`
- `confirmed` → appointment happens → hospital completes → `completed`
- Any state (except completed) → cancel → `cancelled`

**Two booking types:** `DOCTOR` (appointment with a specific doctor) and `ICU` (ICU bed reservation).

### Prescription System

**Medications as JSONB:**
Each prescription stores medications as a PostgreSQL JSONB array:
```json
[
  { "name": "Aspirin", "dosage": "100mg", "frequency": "Once daily", "duration": "30 days" },
  { "name": "Atorvastatin", "dosage": "20mg", "frequency": "Once at night", "duration": "90 days" }
]
```

Why JSONB? Medications have no fixed structure — different prescriptions have different numbers of medications with different fields. A separate medications table would add unnecessary joins.

---

## 12. Frontend Architecture — How the UI Works

### State Management Strategy
Three types of state in the app:

1. **Server state (React Query)** — data from the API
   - Hospital list, emergency requests, bookings etc.
   - React Query fetches, caches, and auto-refreshes
   - `queryKey` uniquely identifies each query for caching

2. **Global state (Zustand)** — auth data
   - User object, access token, isAuthenticated
   - Persisted to localStorage so login survives refresh

3. **Local state (useState)** — UI state
   - Form inputs, modal open/close, filter selections
   - Lives inside individual components

### Protected Routes
React Router ProtectedRoute checks two things:
1. Is the user logged in? → If not, redirect to /login
2. Is the user's role allowed for this route? → If not, redirect to their own dashboard

This prevents a blood donor from accessing `/hospital/dashboard` — they get redirected to `/donor/dashboard`.

### Lazy Loading
All 26 pages use `React.lazy()`:
```typescript
const HospitalDashboard = lazy(() => import('../pages/hospital/DashboardPage'));
```
The JavaScript for each page only downloads when you navigate to it. Initial bundle is small (just the LandingPage + auth pages).

### The Axios Interceptor Chain
Every API call goes through:
1. Request interceptor → attaches JWT token
2. API call
3. Response interceptor → if 401, refresh token and retry

This means you never manually handle token expiry anywhere in the app.

---

## 13. File Uploads — How It Works

### Backend (Multer)
Multer is Express middleware for handling `multipart/form-data` (the encoding type used for file uploads):

```
Client sends: POST /uploads/avatar with Content-Type: multipart/form-data
Multer intercepts the request
Multer saves the file to uploads/ folder on disk
Multer adds file metadata to req.file
Controller returns: { url: '/api/v1/uploads/files/filename.jpg' }
```

**File validation:**
- Extension check: only .jpg, .jpeg, .png, .gif, .pdf allowed
- MIME type check: both extension AND MIME type must match (prevents renaming a .exe to .jpg)
- Size limit: 2MB for avatars, 5MB for prescriptions

### Frontend (AvatarUpload Component)
1. Hidden `<input type="file">` — camera icon button triggers it
2. `FileReader.readAsDataURL(file)` — converts file to base64 string
3. Shows preview immediately (before upload) — fast, local, no network needed
4. `FormData.append('file', file)` + Axios POST with `Content-Type: multipart/form-data`
5. Returns URL → stored in user's `avatarUrl` field in database

---

## 14. Pagination — Why and How

### Why pagination matters
Without pagination, `GET /hospitals` fetches all hospitals. At 1000 hospitals, that's:
- 1000 rows × ~500 bytes each = 500KB per request
- All loaded into browser memory
- Slow to render

With pagination, you fetch 10 at a time. The first page loads in milliseconds.

### How it works

**Backend:**
```typescript
const [hospitals, total] = await qb
  .skip((page - 1) * limit)  // Skip first N records
  .take(limit)                // Take next N records
  .getManyAndCount();         // Returns [data, totalCount]

return {
  data: hospitals,
  meta: { total, page, limit, totalPages: Math.ceil(total/limit), hasNextPage: page < Math.ceil(total/limit) }
};
```

**Frontend:**
```typescript
const [page, setPage] = useState(1);
useQuery({
  queryKey: ['hospitals', page],  // Different queryKey per page
  queryFn: () => hospitalsService.getAll({ page }),
  keepPreviousData: true,  // Show old page while new one loads
})
```

`keepPreviousData: true` means no flicker when navigating between pages.

---

## 15. Testing — What Was Tested and How

### What was tested
34 unit tests across 8 test suites:
- `health.controller.spec.ts` — health endpoint
- `users.service.spec.ts` — findByEmail, findById, save
- `auth.service.spec.ts` — register, login, refresh, logout, forgotPassword, resetPassword (11 tests)
- `auth.controller.spec.ts` — endpoint wiring
- `hospitals.service.spec.ts` — findAll, findNearby, getDashboard
- `emergency.service.spec.ts` — create, accept, reject, cancel, resolve
- `blood.service.spec.ts` — findDonors, createRequest, fulfill
- `doctors.service.spec.ts` — create, update, delete

### Testing approach: Mocking
Unit tests don't hit the real database. They mock the TypeORM repository:

```typescript
const mockRepo = {
  findOne: jest.fn(),
  save: jest.fn(),
  createQueryBuilder: jest.fn().mockReturnValue({
    where: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([mockHospital]),
  }),
};
```

**Why mock the database?**
- Tests run fast (no network call, no database setup)
- Tests are deterministic (same mock = same result every time)
- Tests are isolated (a database failure doesn't fail all tests)

### What was NOT tested and why
- Controllers — thin delegation layers, covered by integration tests
- DTOs — just validation decorators, no logic
- Entities — just TypeORM decorators, no logic
- Frontend pages — visual components, tested manually

### Test coverage
API: 70%+ line coverage on measured files (services and core logic).

---

## 16. DevOps — Docker, CI/CD, Monorepo

### Docker Setup

**docker-compose.yml** (development):
```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: medlink
      POSTGRES_USER: medlink_user
      POSTGRES_PASSWORD: medlink_pass
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data  # Data persists between restarts
```

**Why Docker for PostgreSQL?**
Without Docker, you'd install PostgreSQL directly on your laptop. With Docker:
- No installation conflicts with other projects
- One command to start/stop
- Same version everywhere (dev, CI, production)
- Data persists in a named volume

**Multi-stage Dockerfile for API:**
```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
RUN pnpm install && pnpm build

# Stage 2: Production image
FROM node:20-alpine AS production
WORKDIR /app
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
CMD ["node", "dist/main"]
```

**Why multi-stage?**
The builder stage has all dev dependencies (~500MB). The production stage only has the compiled output + production dependencies (~80MB). Smaller image = faster deploys.

### GitHub Actions CI/CD

Two workflows:

**CI (`.github/workflows/ci.yml`)** — runs on every push:
1. `pnpm install` with frozen lockfile (ensures reproducible installs)
2. `pnpm turbo lint` — ESLint check
3. `pnpm turbo typecheck` — TypeScript check
4. `pnpm turbo test` — all tests (with PostgreSQL service container)
5. `pnpm turbo build` — production build verification

**Why `--frozen-lockfile`?**
If someone adds a package and doesn't commit the lockfile, CI catches it. Ensures everyone on the team and CI uses the exact same package versions.

**PostgreSQL service container in CI:**
```yaml
services:
  postgres:
    image: postgres:16-alpine
    env:
      POSTGRES_DB: medlink_test
```
The test environment gets a real PostgreSQL instance, not a mock. Integration tests can actually connect.

### Turborepo Pipeline

`turbo.json` defines task dependencies:
```json
{
  "pipeline": {
    "build": { "dependsOn": ["^build"] },  // Build shared before api and web
    "test":  { "dependsOn": ["^build"] },  // Build shared before testing
    "dev":   { "cache": false }             // Dev mode never cached
  }
}
```

`^build` means "build all dependencies first". So `packages/shared` always builds before `apps/api` builds.

---

## 17. Deployment Plan — Railway and Netlify

### Railway (API + PostgreSQL)
Railway is a Platform-as-a-Service (PaaS) — like Heroku but modern.

**Why Railway?**
- Free tier with $5/month credit
- Supports Dockerfile deployment — consistent with local Docker setup
- Managed PostgreSQL — automatic backups, no maintenance
- Environment variables injected at runtime — secrets never in code

**How the API deploys:**
1. Connect GitHub repo to Railway
2. Railway detects `railway.json` → uses Dockerfile
3. On every push to `main`, Railway pulls the code, builds the Docker image, deploys
4. `DATABASE_URL` is injected as environment variable — TypeORM uses it automatically

### Netlify (Frontend)
Netlify is a CDN-based static hosting platform.

**Why Netlify for React?**
React builds to static HTML/JS/CSS files in `dist/`. Netlify serves these files from CDNs worldwide — fast everywhere.

**The SPA redirect rule (most important setting):**
```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

Without this: navigating to `https://medlink.netlify.app/patient/dashboard` returns 404 — Netlify looks for a file at that path, finds none.

With this: all paths serve `index.html`, React Router handles the routing client-side.

**The API proxy:**
```toml
[[redirects]]
  from = "/api/*"
  to = "https://YOUR_RAILWAY_URL/api/:splat"
  status = 200
  force = true
```

The frontend makes requests to `/api/v1/hospitals`. Netlify proxies them to Railway. This avoids CORS issues and hides the Railway URL.

---

## 18. What Is Missing and Why

### Email sending
The forgot password flow generates and stores a reset token but logs the link to the console instead of emailing it. A real email service (SendGrid, Resend, or Nodemailer with Gmail) would take 30 minutes to wire up.

### Input sanitization
Inputs are validated (is it an email? is the password strong?) but HTML tags are not stripped. `<script>alert('xss')</script>` entered as a name would be stored as-is. Adding `sanitize-html` would fix this.

### Token storage improvement
Access token is in localStorage (vulnerable to XSS). Production best practice is memory-only storage with httpOnly cookie for both tokens.

### Email verification
Users can register with any email without proving it's theirs. A verification step would add trust.

### Admin panel
No super-admin exists. Hospital registrations are not moderated. In production, hospitals would need to be verified before being listed.

### Advanced search
Hospital search only filters by city. No search by name, no sort by rating, no radius-based search from current GPS.

### Analytics
No charts or trends. No data on average emergency response time, total donations over time, peak usage hours.

---

## 19. The Data — Where It Comes From

### Seed data (demo)
The 5 hospitals in the demo (Apollo Mumbai, AIIMS Delhi, Manipal Bangalore, Fortis Malar Chennai, Yashoda Hyderabad) are **real hospital names** at **real GPS coordinates** but the ICU counts and doctor numbers are **realistic fictional values** — not live data.

### In production, where would data come from?
1. **Hospital admins register themselves** — each hospital creates an account and fills in their own data through the dashboard. The Resources page lets them update ICU beds, ambulances, and doctors in real-time.
2. **Real-time updates** — a hospital admin updates their ICU count → it reflects immediately for all patients searching nearby hospitals.
3. **Integration possibility** — India's National Health Authority (NHA) and Ayushman Bharat Digital Mission (ABDM) expose hospital registry APIs. Integrating these would give access to verified hospital data across India.

### The honest answer for interviewers
> "The current data is seed data for demonstration. In production, the data is user-generated — each hospital manages their own profile through the admin dashboard. For verified hospital onboarding at scale, we would integrate with NHA/ABDM APIs which provide official hospital registry data."

---

## 20. Challenges Faced During Development

### 1. TypeORM nullable string columns
**Problem:** TypeORM couldn't handle `string | null` union types on entity properties. It inferred the type as `Object` and crashed with `DataTypeNotSupportedError`.

**Solution:** Added explicit `type: 'varchar'` to every nullable string column:
```typescript
// Wrong:
@Column({ length: 15, nullable: true })
phone!: string | null;

// Correct:
@Column({ type: 'varchar', length: 15, nullable: true })
phone!: string | null;
```

**Learning:** TypeORM needs explicit type declarations for nullable fields when using TypeScript strict mode.

### 2. Monorepo build path issue
**Problem:** The NestJS API compiled but couldn't find `@medlink/shared` at runtime because `packages/shared` was TypeScript source, not compiled JavaScript. The compiled API tried to load `.ts` files which Node.js can't run.

**Solution:** Created a separate `tsconfig.build.json` for `packages/shared` that compiles to `dist/`. The API's `tsconfig.build.json` overrides the shared package path to point to `dist/index.d.ts` instead of `src/index.ts`.

**Learning:** In a monorepo, packages consumed by compiled output must themselves be compiled first. Turborepo's `dependsOn: ["^build"]` ensures this order.

### 3. The .env committed to GitHub
**Problem:** The original hackathon `.env` file was tracked by git before the `.gitignore` was properly set up. When we pushed, the `.env` appeared on GitHub.

**Solution:** Used `git rm --cached .env` to untrack it, added proper `.gitignore` rules, committed the removal.

**Learning:** `.gitignore` only prevents untracked files from being added. Files that were already tracked need to be explicitly untracked with `git rm --cached`.

### 4. Google API key in git history
**Problem:** An old hackathon file (`patient.html`) contained a Google Maps API key that was committed in the early history. Even after deleting the file, GitHub secret scanning found it in the git history.

**Solution:** Used `git filter-repo --replace-text replacements.txt` to rewrite all 58 commits in history, replacing the API key with `REDACTED_GOOGLE_API_KEY`. Force pushed the clean history.

**Learning:** Deleting a file doesn't remove it from git history. `git filter-repo` is the modern tool for rewriting history (replacing deprecated `git filter-branch`).

### 5. Vite dev server showing stale cached modules
**Problem:** After adding new component files, the browser showed a blank white page with 500 errors. The Vite dev server was serving stale module cache.

**Solution:** Cleared Vite's cache (`rm -rf node_modules/.vite`) and restarted the dev server.

**Learning:** Vite caches module transforms in `node_modules/.vite`. When major changes are made to the file structure, clearing this cache and restarting resolves 500 errors.

---

## 21. Interview Questions and Answers

### Architecture questions

**Q: Why did you choose a monorepo?**
A: A monorepo with Turborepo gives us shared TypeScript types between the frontend and backend in `packages/shared`. If the API changes a field name, TypeScript immediately shows the error in the frontend — no drift between the two codebases. It also means one `docker-compose up` runs everything, and one `pnpm turbo test` runs all tests. This is how large companies like Google, Meta, and Vercel structure their codebases.

**Q: Why NestJS over Express?**
A: Express is unopinionated — you can structure code any way you want, which is great for small projects but creates inconsistency in teams. NestJS enforces a module/controller/service pattern through TypeScript decorators. Every developer on the team structures code the same way. It also has built-in dependency injection, guards, interceptors, and pipes — all the patterns you find in enterprise backends. Plus it auto-generates Swagger documentation from the code.

**Q: Why PostgreSQL over MongoDB?**
A: Healthcare data is inherently relational — a booking belongs to a patient, who has a doctor, who belongs to a hospital. Foreign keys enforce this relationship at the database level. If I delete a hospital, all related doctors, bookings, and emergencies are handled via CASCADE rules. MongoDB's flexible schema would let inconsistent data creep in. PostgreSQL also has proper transactions — if creating a booking fails halfway, the database rolls back automatically.

**Q: How does the shared package work?**
A: `packages/shared` is a TypeScript package that exports enums (Role, BloodGroup, EmergencyStatus), interfaces (IUser, IHospital, IEmergencyRequest), and constants (SOCKET_EVENTS, BCRYPT_SALT_ROUNDS). The API imports these for its entities and DTOs. The frontend imports the same types for its service functions and components. When `packages/shared` is built first (Turborepo ensures this), both the API and frontend use compiled JavaScript types with full TypeScript intelligence.

---

### Authentication questions

**Q: Explain your authentication flow.**
A: We use a two-token system. On login, the server issues a short-lived JWT access token (15 minutes) returned in the response body, and a long-lived refresh token (7 days) set as an httpOnly cookie. The access token is attached to every API request via an Axios interceptor. When the access token expires and the API returns 401, the same Axios interceptor automatically calls the refresh endpoint — the httpOnly cookie is sent automatically by the browser — gets a new access token, and retries the original request. The user never notices.

**Q: Why httpOnly cookie for the refresh token?**
A: An httpOnly cookie cannot be read by JavaScript. This means if there's an XSS vulnerability somewhere in the frontend, an attacker's injected script cannot steal the refresh token. The access token in localStorage is readable by JavaScript, but it expires in 15 minutes — limited damage window. The refresh token in httpOnly cookie is protected from XSS entirely.

**Q: How do you handle token rotation?**
A: Every time a refresh token is used to get a new access token, the old refresh token is revoked in the database and a new one is issued. This prevents refresh token reuse attacks. If an attacker somehow gets a refresh token and uses it, the legitimate user's next refresh will fail (old token revoked), signaling a potential compromise.

**Q: How does role-based access control work?**
A: Every protected endpoint has two guards: `JwtAuthGuard` (validates the JWT) and `RolesGuard` (checks the role). The `@Roles(Role.HOSPITAL)` decorator on a controller method specifies who can access it. `RolesGuard` reads the user from the JWT payload and checks if their role is in the allowed list. On the frontend, `ProtectedRoute` does the same for pages — a blood donor navigating to `/hospital/dashboard` gets redirected to `/donor/dashboard`.

---

### Real-time questions

**Q: How does Socket.IO work in your project?**
A: The NestJS backend has a `@WebSocketGateway` class. When a user connects with their JWT token, they're authenticated and joined to role-specific rooms. For example, all hospital admins for "Apollo Mumbai" are in room `hospital:<hospitalId>`. When a patient sends an SOS, `EmergencyService` emits `emergency:new` to that hospital's room — all connected hospital admin tabs see the emergency instantly. On the frontend, a React `useEffect` registers a Socket.IO event listener and invalidates the React Query cache when the event fires, triggering a background refetch.

**Q: Why Socket.IO instead of plain WebSocket?**
A: Socket.IO gives us rooms (broadcast to a group, not all connected users), automatic reconnection if the connection drops, fallback to HTTP long-polling for environments where WebSocket is blocked (corporate firewalls), and a clean event-based API with named events. Plain WebSocket would require implementing all of this manually.

**Q: How does the ambulance live tracking work?**
A: When a driver goes on duty, the driver's dashboard starts a `setInterval` that fires every 5 seconds. Each interval calls `navigator.geolocation.getCurrentPosition`, then makes a REST API call to `PUT /ambulance/location` (persists to database) AND emits a Socket.IO event `driver:location_update` with the coordinates. The server forwards this to the patient who is tracking that driver. The patient's map updates with the new position every 5 seconds.

---

### Database questions

**Q: Why do you have a separate table for hospital admins vs hospitals?**
A: The `users` table handles authentication for all roles. A hospital admin is a user with `role: 'hospital'`. The `hospitals` table stores hospital-specific metadata — ICU counts, GPS, phone, rating. This separation keeps auth logic clean (one JWT strategy for all users) while allowing hospital-specific data to grow independently. They're linked via a one-to-one relationship on `userId`.

**Q: Why store medications as JSONB?**
A: Prescriptions have an unpredictable number of medications with varying fields. A separate `medications` table would require multiple joins for every prescription read. JSONB in PostgreSQL stores structured JSON that can be queried if needed, while keeping medication data co-located with the prescription. Since medications are always read/written with the prescription (never independently), co-location makes sense.

**Q: How do you handle database migrations?**
A: In development, TypeORM's `synchronize: true` automatically creates/updates tables from entity definitions. This is fast for development but dangerous in production (could drop columns). For production, `synchronize: false` and TypeORM migration files are used. Migrations are SQL scripts that describe exact schema changes — they're version-controlled and run once.

---

### Frontend questions

**Q: Why React Query instead of Redux for data fetching?**
A: Redux is a general state management library — using it for API data means writing actions, reducers, selectors, and middleware for every API call. React Query is specifically designed for server state. It handles caching, background refetching, loading/error states, pagination, and optimistic updates out of the box. For the auth state (user object, token), we use Zustand — a lightweight store that's appropriate for that small amount of global state.

**Q: What is the difference between server state and client state?**
A: Server state is data that lives on the server and needs to be fetched — hospitals, bookings, emergencies. It can be stale, needs to be refetched, and can change from other clients. React Query handles this. Client state is UI state that exists only in the browser — whether a modal is open, form input values, current filter selection. This lives in `useState`. Auth state (who is logged in) is a third category — global client state that persists across pages, handled by Zustand.

**Q: How does lazy loading work?**
A: Each of the 26 pages is wrapped in `React.lazy()`. This tells Vite to split that page's code into a separate JavaScript chunk. When the user first visits the app, only the LandingPage and auth page code downloads. When they navigate to `/patient/hospitals`, the HospitalsPage chunk downloads for the first time (then cached). This keeps the initial bundle small and makes first load fast.

---

### DevOps questions

**Q: What does your CI/CD pipeline do?**
A: On every push to GitHub, GitHub Actions runs: ESLint (code style), TypeScript compiler (type checking), Jest tests with a real PostgreSQL container, and production build verification. If any step fails, the push is flagged. Merges to `main` would trigger deployment to Railway (API) and Netlify (frontend). This means broken code can never reach production.

**Q: Why use Docker for local development?**
A: Without Docker, every developer installs PostgreSQL directly on their machine — different versions, different configurations, potential conflicts with other projects. With Docker, one `docker-compose up postgres -d` gives every developer the exact same PostgreSQL 16 instance in an isolated container. The data persists in a named Docker volume between restarts. When done with the project, `docker-compose down -v` removes everything cleanly.

**Q: What is Turborepo and why use it?**
A: Turborepo is a build system for JavaScript monorepos. It defines task dependencies (`build shared before api`), runs tasks in parallel where possible, and caches task outputs. If you run `pnpm turbo test` and nothing has changed, it returns the cached test results instantly. This makes CI much faster. It also orchestrates the correct build order across packages.

---

### General project questions

**Q: How long did this project take to build?**
A: The complete rebuild from scratch — NestJS API with 47 endpoints, 11 database entities, real-time WebSocket, complete React frontend with 26 pages, Docker setup, CI/CD, seed data, and documentation — was built as a structured engineering exercise with detailed planning before each phase.

**Q: What would you do differently if you built this again?**
A: I would add email delivery from the start (the forgot password flow is incomplete without it), move the access token from localStorage to memory-only storage for better security, and add input sanitization with a library like `sanitize-html`. I'd also consider using Prisma instead of TypeORM for better TypeScript integration and a more explicit migration workflow.

**Q: Where does the hospital data come from?**
A: The demo data is seed data — realistic but fictional values for 5 well-known Indian hospitals. In production, data is user-generated: each hospital admin registers and manages their own data through the dashboard. For verified data at scale, we would integrate with India's National Health Authority (NHA) or Ayushman Bharat Digital Mission (ABDM) APIs which provide the official hospital registry.

**Q: How would you scale this for 10,000 concurrent users?**
A: Several changes would be needed. First, add Redis for Socket.IO — currently Socket.IO state is in-memory, so multiple API server instances can't share socket connections. With Redis adapter, any instance can emit to any room. Second, add database connection pooling with PgBouncer to handle many concurrent DB connections. Third, add a Redis cache layer for frequently-read data (hospital list, ICU counts). Fourth, deploy the API across multiple Railway instances behind a load balancer. Fifth, add a CDN for uploaded files instead of serving from the API server directly.

**Q: How would you add a mobile app?**
A: The backend is completely ready — it's a standard REST + WebSocket API. A React Native app would call the same endpoints. The `packages/shared` TypeScript types work in React Native as well. The main additions would be: push notifications via Firebase Cloud Messaging (background alerts even when app is closed), native maps integration, and deep linking for password reset emails.

---

*This document covers the complete MedLink project. Use it to prepare for any technical interview question about architecture, technology choices, security, real-time systems, database design, or DevOps.*
