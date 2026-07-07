# MedLink Plan 5: Seed Data, Swagger, Deployment & README

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the production-ready project by adding realistic seed data, verifying Swagger documentation, deploying the API to Railway and the frontend to Vercel, configuring GitHub Actions secrets, and writing a comprehensive README that showcases the project.

**Architecture:** Seed script uses TypeORM DataSource directly (not the NestJS app) to populate test data. Swagger is auto-generated from NestJS decorators. Deployment via Railway CLI (API + PostgreSQL) and Vercel CLI (frontend). GitHub Actions CD workflow uses secrets stored in the repository.

**Tech Stack:** TypeORM CLI, Railway CLI, Vercel CLI, GitHub Actions

**Prerequisite:** Plans 1–4 complete — full working app locally.

---

## File Map

- Create: `apps/api/src/database/seeds/seed.ts` — runnable seed script
- Modify: `apps/api/package.json` — add `seed` script
- Create: `railway.json` — Railway deployment config
- Create: `vercel.json` — Vercel deployment config
- Create: `README.md` — comprehensive project README

---

## Task 1: Database seed script

**Files:**
- Create: `apps/api/src/database/seeds/seed.ts`

- [ ] **Step 1: Create `apps/api/src/database/seeds/seed.ts`**

```typescript
import { AppDataSource } from '../data-source';
import * as bcrypt from 'bcryptjs';
import { UserEntity } from '../entities/user.entity';
import { HospitalEntity } from '../entities/hospital.entity';
import { BloodDonorEntity } from '../entities/blood-donor.entity';
import { AmbulanceDriverEntity } from '../entities/ambulance-driver.entity';
import { DoctorEntity } from '../entities/doctor.entity';
import { EmergencyRequestEntity } from '../entities/emergency-request.entity';
import { BloodRequestEntity } from '../entities/blood-request.entity';
import { BookingEntity } from '../entities/booking.entity';
import { Role, BloodGroup, EmergencyType, EmergencyStatus, BloodRequestStatus, BloodRequestUrgency, BookingType, BookingStatus, BCRYPT_SALT_ROUNDS } from '@medlink/shared';

async function seed() {
  await AppDataSource.initialize();
  console.log('Connected to database');

  const userRepo = AppDataSource.getRepository(UserEntity);
  const hospitalRepo = AppDataSource.getRepository(HospitalEntity);
  const donorRepo = AppDataSource.getRepository(BloodDonorEntity);
  const driverRepo = AppDataSource.getRepository(AmbulanceDriverEntity);
  const doctorRepo = AppDataSource.getRepository(DoctorEntity);
  const emergencyRepo = AppDataSource.getRepository(EmergencyRequestEntity);
  const bloodReqRepo = AppDataSource.getRepository(BloodRequestEntity);
  const bookingRepo = AppDataSource.getRepository(BookingEntity);

  const pw = await bcrypt.hash('Test@12345', BCRYPT_SALT_ROUNDS);

  // --- Patients ---
  const patients: UserEntity[] = [];
  const patientData = [
    { name: 'Amit Sharma', email: 'amit@medlink.demo' },
    { name: 'Priya Patel', email: 'priya@medlink.demo' },
    { name: 'Ravi Kumar', email: 'ravi@medlink.demo' },
  ];
  for (const p of patientData) {
    const existing = await userRepo.findOne({ where: { email: p.email } });
    if (!existing) {
      const u = await userRepo.save({ ...p, passwordHash: pw, role: Role.PATIENT, phone: '+919876543210', isActive: true });
      patients.push(u);
    } else { patients.push(existing); }
  }
  console.log(`Seeded ${patients.length} patients`);

  // --- Hospitals ---
  const hospitalData = [
    { name: 'Apollo Hospital Mumbai', city: 'Mumbai', state: 'Maharashtra', address: 'Sahar Road, Andheri East', phone: '+912267676767', latitude: 19.1136, longitude: 72.8697, icuBedsTotal: 50, icuBedsAvailable: 12, totalDoctors: 120, ambulancesTotal: 10, ambulancesAvailable: 4, rating: 4.8, email: 'apollo_hospital@medlink.demo' },
    { name: 'AIIMS Delhi', city: 'Delhi', state: 'Delhi', address: 'Sri Aurobindo Marg, Ansari Nagar', phone: '+911126588500', latitude: 28.5672, longitude: 77.2100, icuBedsTotal: 80, icuBedsAvailable: 5, totalDoctors: 200, ambulancesTotal: 15, ambulancesAvailable: 6, rating: 4.9, email: 'aiims_delhi@medlink.demo' },
    { name: 'Manipal Hospital Bangalore', city: 'Bangalore', state: 'Karnataka', address: '98 HAL Airport Road, Kodihalli', phone: '+918025024444', latitude: 12.9716, longitude: 77.5946, icuBedsTotal: 60, icuBedsAvailable: 20, totalDoctors: 150, ambulancesTotal: 8, ambulancesAvailable: 3, rating: 4.7, email: 'manipal_hospital@medlink.demo' },
    { name: 'Fortis Malar Hospital Chennai', city: 'Chennai', state: 'Tamil Nadu', address: '52 1st Main Road, Gandhi Nagar', phone: '+914443592222', latitude: 13.0827, longitude: 80.2707, icuBedsTotal: 40, icuBedsAvailable: 8, totalDoctors: 90, ambulancesTotal: 6, ambulancesAvailable: 2, rating: 4.6, email: 'fortis_malar@medlink.demo' },
    { name: 'Yashoda Hospitals Hyderabad', city: 'Hyderabad', state: 'Telangana', address: 'Raj Bhavan Road, Somajiguda', phone: '+914066760000', latitude: 17.3850, longitude: 78.4867, icuBedsTotal: 45, icuBedsAvailable: 15, totalDoctors: 100, ambulancesTotal: 7, ambulancesAvailable: 4, rating: 4.5, email: 'yashoda@medlink.demo' },
  ];

  const hospitalAdmins: UserEntity[] = [];
  const hospitals: HospitalEntity[] = [];
  for (const h of hospitalData) {
    const existing = await userRepo.findOne({ where: { email: h.email } });
    let admin: UserEntity;
    if (!existing) {
      admin = await userRepo.save({ name: `${h.name} Admin`, email: h.email, passwordHash: pw, role: Role.HOSPITAL, isActive: true });
    } else { admin = existing; }
    hospitalAdmins.push(admin);
    const existingHospital = await hospitalRepo.findOne({ where: { userId: admin.id } });
    if (!existingHospital) {
      const hospital = await hospitalRepo.save({ userId: admin.id, name: h.name, city: h.city, state: h.state, address: h.address, phone: h.phone, latitude: h.latitude, longitude: h.longitude, icuBedsTotal: h.icuBedsTotal, icuBedsAvailable: h.icuBedsAvailable, totalDoctors: h.totalDoctors, ambulancesTotal: h.ambulancesTotal, ambulancesAvailable: h.ambulancesAvailable, rating: h.rating });
      hospitals.push(hospital);
    } else { hospitals.push(existingHospital); }
  }
  console.log(`Seeded ${hospitals.length} hospitals`);

  // --- Doctors ---
  const doctorData = [
    { hospitalIndex: 0, name: 'Dr. Suresh Mehta', speciality: 'Cardiology', phone: '+919900001111' },
    { hospitalIndex: 0, name: 'Dr. Anjali Singh', speciality: 'Neurology', phone: '+919900001112' },
    { hospitalIndex: 0, name: 'Dr. Vikram Rao', speciality: 'Orthopedics', phone: '+919900001113' },
    { hospitalIndex: 1, name: 'Dr. Kavitha Reddy', speciality: 'Oncology', phone: '+919900002111' },
    { hospitalIndex: 1, name: 'Dr. Arjun Nair', speciality: 'Emergency Medicine', phone: '+919900002112' },
    { hospitalIndex: 2, name: 'Dr. Pooja Iyer', speciality: 'Pediatrics', phone: '+919900003111' },
    { hospitalIndex: 2, name: 'Dr. Raj Malhotra', speciality: 'General Surgery', phone: '+919900003112' },
    { hospitalIndex: 3, name: 'Dr. Meena Krishnan', speciality: 'Obstetrics', phone: '+919900004111' },
    { hospitalIndex: 4, name: 'Dr. Sanjay Gupta', speciality: 'Pulmonology', phone: '+919900005111' },
    { hospitalIndex: 4, name: 'Dr. Divya Choudhary', speciality: 'Dermatology', phone: '+919900005112' },
  ];
  const doctors: DoctorEntity[] = [];
  for (const d of doctorData) {
    const existing = await doctorRepo.findOne({ where: { name: d.name, hospitalId: hospitals[d.hospitalIndex].id } });
    if (!existing) {
      const doc = await doctorRepo.save({ hospitalId: hospitals[d.hospitalIndex].id, name: d.name, speciality: d.speciality, phone: d.phone, isAvailable: true });
      doctors.push(doc);
    } else { doctors.push(existing); }
  }
  console.log(`Seeded ${doctors.length} doctors`);

  // --- Blood Donors ---
  const donorData = [
    { name: 'Kiran Desai', email: 'kiran@medlink.demo', bloodGroup: BloodGroup.O_POS, city: 'Mumbai', latitude: 19.0760, longitude: 72.8777 },
    { name: 'Neha Joshi', email: 'neha@medlink.demo', bloodGroup: BloodGroup.A_POS, city: 'Delhi', latitude: 28.7041, longitude: 77.1025 },
    { name: 'Rahul Verma', email: 'rahul@medlink.demo', bloodGroup: BloodGroup.B_POS, city: 'Bangalore', latitude: 12.9141, longitude: 74.8560 },
    { name: 'Sneha Pillai', email: 'sneha@medlink.demo', bloodGroup: BloodGroup.AB_POS, city: 'Chennai', latitude: 13.0827, longitude: 80.2707 },
    { name: 'Mohan Das', email: 'mohan@medlink.demo', bloodGroup: BloodGroup.O_NEG, city: 'Hyderabad', latitude: 17.3850, longitude: 78.4867 },
    { name: 'Lakshmi Nair', email: 'lakshmi@medlink.demo', bloodGroup: BloodGroup.A_NEG, city: 'Mumbai', latitude: 19.2183, longitude: 72.9781 },
  ];
  const bloodDonors: BloodDonorEntity[] = [];
  for (const d of donorData) {
    const existing = await userRepo.findOne({ where: { email: d.email } });
    let user: UserEntity;
    if (!existing) {
      user = await userRepo.save({ name: d.name, email: d.email, passwordHash: pw, role: Role.DONOR, isActive: true });
    } else { user = existing; }
    const existingDonor = await donorRepo.findOne({ where: { userId: user.id } });
    if (!existingDonor) {
      const donor = await donorRepo.save({ userId: user.id, bloodGroup: d.bloodGroup, city: d.city, latitude: d.latitude, longitude: d.longitude, isAvailable: true, totalDonations: Math.floor(Math.random() * 5) });
      bloodDonors.push(donor);
    } else { bloodDonors.push(existingDonor); }
  }
  console.log(`Seeded ${bloodDonors.length} blood donors`);

  // --- Ambulance Drivers ---
  const driverData = [
    { name: 'Rajesh Kumar', email: 'driver1@medlink.demo', vehicleNumber: 'MH01AB1234', hospitalIndex: 0, isOnDuty: true, latitude: 19.1100, longitude: 72.8700 },
    { name: 'Sunil Yadav', email: 'driver2@medlink.demo', vehicleNumber: 'DL01CD5678', hospitalIndex: 1, isOnDuty: false, latitude: 28.5700, longitude: 77.2100 },
    { name: 'Deepak Mishra', email: 'driver3@medlink.demo', vehicleNumber: 'KA01EF9012', hospitalIndex: 2, isOnDuty: true, latitude: 12.9700, longitude: 77.5900 },
    { name: 'Arun Singh', email: 'driver4@medlink.demo', vehicleNumber: 'TN01GH3456', hospitalIndex: 3, isOnDuty: false, latitude: 13.0800, longitude: 80.2700 },
  ];
  for (const d of driverData) {
    const existing = await userRepo.findOne({ where: { email: d.email } });
    let user: UserEntity;
    if (!existing) {
      user = await userRepo.save({ name: d.name, email: d.email, passwordHash: pw, role: Role.DRIVER, isActive: true });
    } else { user = existing; }
    const existingDriver = await driverRepo.findOne({ where: { userId: user.id } });
    if (!existingDriver) {
      await driverRepo.save({ userId: user.id, hospitalId: hospitals[d.hospitalIndex].id, vehicleNumber: d.vehicleNumber, isOnDuty: d.isOnDuty, latitude: d.latitude, longitude: d.longitude });
    }
  }
  console.log('Seeded ambulance drivers');

  // --- Sample Emergency Requests ---
  if (patients.length && hospitals.length) {
    const existingEmergency = await emergencyRepo.findOne({ where: { patientId: patients[0].id } });
    if (!existingEmergency) {
      await emergencyRepo.save([
        { patientId: patients[0].id, hospitalId: hospitals[0].id, type: EmergencyType.ICU, status: EmergencyStatus.ACCEPTED, patientLat: 19.0760, patientLng: 72.8777, description: 'Chest pain, needs ICU immediately' },
        { patientId: patients[1].id, type: EmergencyType.AMBULANCE, status: EmergencyStatus.PENDING, patientLat: 28.7041, patientLng: 77.1025, description: 'Road accident' },
      ]);
      console.log('Seeded emergency requests');
    }
  }

  // --- Sample Blood Requests ---
  if (patients.length) {
    const existingBloodReq = await bloodReqRepo.findOne({ where: { patientId: patients[0].id } });
    if (!existingBloodReq) {
      await bloodReqRepo.save([
        { patientId: patients[0].id, bloodGroup: BloodGroup.O_POS, status: BloodRequestStatus.PENDING, unitsRequired: 2, urgency: BloodRequestUrgency.CRITICAL },
        { patientId: patients[1].id, donorId: bloodDonors[0]?.id, bloodGroup: BloodGroup.A_POS, status: BloodRequestStatus.FULFILLED, unitsRequired: 1, urgency: BloodRequestUrgency.MEDIUM },
      ]);
      console.log('Seeded blood requests');
    }
  }

  // --- Sample Bookings ---
  if (patients.length && doctors.length) {
    const existingBooking = await bookingRepo.findOne({ where: { patientId: patients[0].id } });
    if (!existingBooking) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      await bookingRepo.save([
        { patientId: patients[0].id, doctorId: doctors[0].id, hospitalId: hospitals[0].id, type: BookingType.DOCTOR, status: BookingStatus.CONFIRMED, scheduledAt: tomorrow, notes: 'Follow-up appointment' },
        { patientId: patients[1].id, doctorId: doctors[1].id, hospitalId: hospitals[0].id, type: BookingType.DOCTOR, status: BookingStatus.PENDING, scheduledAt: tomorrow },
      ]);
      console.log('Seeded bookings');
    }
  }

  await AppDataSource.destroy();
  console.log('\n✅ Seed complete!');
  console.log('\nDemo accounts (password: Test@12345):');
  console.log('  Patient:  amit@medlink.demo');
  console.log('  Hospital: apollo_hospital@medlink.demo');
  console.log('  Donor:    kiran@medlink.demo');
  console.log('  Driver:   driver1@medlink.demo');
}

seed().catch((e) => { console.error('Seed failed:', e); process.exit(1); });
```

Save to: `apps/api/src/database/seeds/seed.ts`

- [ ] **Step 2: Add seed script to `apps/api/package.json`**

Add to the `scripts` block:
```json
"seed": "ts-node -r tsconfig-paths/register src/database/seeds/seed.ts"
```

Also add `tsconfig-paths` to devDependencies:
```json
"tsconfig-paths": "^4.2.0"
```

- [ ] **Step 3: Install the new dependency**

```bash
cd apps/api && pnpm install
```

Expected: `tsconfig-paths` installed.

- [ ] **Step 4: Run the seed against your local database**

```bash
# Ensure postgres is running
docker-compose up postgres -d

# From apps/api
cd apps/api && pnpm seed
```

Expected output:
```
Connected to database
Seeded 3 patients
Seeded 5 hospitals
Seeded 10 doctors
Seeded 6 blood donors
Seeded ambulance drivers
Seeded emergency requests
Seeded blood requests
Seeded bookings

✅ Seed complete!

Demo accounts (password: Test@12345):
  Patient:  amit@medlink.demo
  Hospital: apollo_hospital@medlink.demo
  Donor:    kiran@medlink.demo
  Driver:   driver1@medlink.demo
```

- [ ] **Step 5: Verify seed data via API**

```bash
# Login with seeded patient
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"amit@medlink.demo","password":"Test@12345"}'
```

Expected: `{ "success": true, "data": { "accessToken": "...", "user": { "name": "Amit Sharma", "role": "patient" } } }`

```bash
# Get hospitals (use token from above)
curl http://localhost:3000/api/v1/hospitals \
  -H "Authorization: Bearer <token>"
```

Expected: Array of 5 hospitals with cities Mumbai, Delhi, Bangalore, Chennai, Hyderabad.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/database/seeds/ apps/api/package.json pnpm-lock.yaml
git commit -m "feat(api): add database seed with realistic Indian hospital/doctor/donor/driver data"
```

---

## Task 2: Verify Swagger documentation completeness

- [ ] **Step 1: Start the API**

```bash
cd apps/api && pnpm dev
```

- [ ] **Step 2: Open Swagger UI**

Open `http://localhost:3000/api/docs` in browser.

- [ ] **Step 3: Verify all endpoint groups are present**

Check that ALL of these tag groups appear in Swagger:
- `auth` — 5 endpoints (register, login, refresh, logout, me)
- `hospitals` — 7 endpoints
- `doctors` — 3 endpoints
- `emergency` — 7 endpoints
- `blood` — 8 endpoints
- `bookings` — 6 endpoints
- `prescriptions` — 3 endpoints
- `ambulance` — 4 endpoints
- `notifications` — 3 endpoints
- `health` — 1 endpoint

Total: 47 endpoints. If any are missing, check that the module is registered in `AppModule` and the controller has `@ApiTags`.

- [ ] **Step 4: Test auth via Swagger UI**

1. Click on `POST /api/v1/auth/login`
2. Click "Try it out"
3. Enter `{ "email": "amit@medlink.demo", "password": "Test@12345" }`
4. Execute — verify 200 response with `accessToken`
5. Click "Authorize" (lock icon at top)
6. Enter `Bearer <token>`
7. Test `GET /api/v1/auth/me` — verify returns user details

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "docs(api): verify Swagger covers all 47 endpoints — complete API documentation"
```

---

## Task 3: Railway deployment (API + PostgreSQL)

- [ ] **Step 1: Install Railway CLI**

```bash
npm install -g @railway/cli
```

- [ ] **Step 2: Login to Railway**

```bash
railway login
```

Expected: Browser opens for auth, then CLI shows "Logged in as <your email>".

- [ ] **Step 3: Create Railway project**

```bash
railway init
```

When prompted:
- Project name: `medlink`
- Select: Create new project

- [ ] **Step 4: Add PostgreSQL service to Railway**

In Railway dashboard (https://railway.app):
1. Open the `medlink` project
2. Click "+ New" → Database → PostgreSQL
3. Copy the `DATABASE_URL` from the PostgreSQL service variables

- [ ] **Step 5: Create `railway.json` in repo root**

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "apps/api/Dockerfile"
  },
  "deploy": {
    "startCommand": "node dist/main",
    "healthcheckPath": "/api/v1/health",
    "healthcheckTimeout": 30,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  }
}
```

Save to: `railway.json`

- [ ] **Step 6: Set Railway environment variables**

In Railway dashboard → medlink-api service → Variables, add:
```
DATABASE_URL=<from postgresql service>
NODE_ENV=production
JWT_SECRET=<generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))">
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY_DAYS=7
FRONTEND_URL=https://<your-vercel-url> (update after Vercel deploy)
PORT=3000
```

- [ ] **Step 7: Deploy API to Railway**

```bash
railway up --service medlink-api
```

Expected: Build starts, Docker image built and deployed. Watch logs in Railway dashboard.

- [ ] **Step 8: Run seed on Railway database**

```bash
# Set DATABASE_URL to Railway postgres URL temporarily
DATABASE_URL=<railway-postgres-url> cd apps/api && pnpm seed
```

Expected: Same output as local seed.

- [ ] **Step 9: Verify live API**

```bash
curl https://<railway-url>/api/v1/health
```

Expected: `{ "success": true, "data": { "status": "ok" } }`

```bash
curl https://<railway-url>/api/docs
```

Expected: Swagger UI HTML response.

- [ ] **Step 10: Commit**

```bash
git add railway.json
git commit -m "chore: add Railway deployment config"
```

---

## Task 4: Vercel deployment (Frontend)

- [ ] **Step 1: Install Vercel CLI**

```bash
npm install -g vercel
```

- [ ] **Step 2: Login to Vercel**

```bash
cd apps/web && vercel login
```

- [ ] **Step 3: Create `vercel.json` in `apps/web/`**

```json
{
  "buildCommand": "pnpm build",
  "outputDirectory": "dist",
  "installCommand": "pnpm install",
  "framework": "vite",
  "rewrites": [
    { "source": "/api/(.*)", "destination": "https://<railway-api-url>/api/$1" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

Replace `<railway-api-url>` with your actual Railway API URL.

Save to: `apps/web/vercel.json`

- [ ] **Step 4: Set Vercel environment variables**

```bash
vercel env add VITE_GOOGLE_MAPS_API_KEY production
```

Enter your Google Maps API key when prompted.

- [ ] **Step 5: Deploy to Vercel**

```bash
cd apps/web && vercel --prod
```

Expected: Build succeeds, URL printed: `https://medlink-<hash>.vercel.app`

- [ ] **Step 6: Update Railway FRONTEND_URL**

In Railway dashboard, update `FRONTEND_URL` variable to your Vercel URL.

Redeploy Railway API:
```bash
railway up --service medlink-api
```

- [ ] **Step 7: Smoke test live deployment**

1. Open `https://<vercel-url>` — landing page loads
2. Click "Get Started" — register page loads
3. Register with `amit@medlink.demo` / `Test@12345`
4. Verify redirect to patient dashboard with real hospital data

- [ ] **Step 8: Commit**

```bash
git add apps/web/vercel.json
git commit -m "chore: add Vercel deployment config for frontend"
```

---

## Task 5: Configure GitHub Actions secrets

- [ ] **Step 1: Get required secret values**

Gather these values:
- `RAILWAY_TOKEN` — from Railway dashboard → Account → Tokens → Create Token
- `VERCEL_TOKEN` — from Vercel dashboard → Account Settings → Tokens → Create
- `VERCEL_ORG_ID` — from `~/.vercel/project.json` after `vercel link`
- `VERCEL_PROJECT_ID` — from `~/.vercel/project.json` after `vercel link`

- [ ] **Step 2: Add secrets to GitHub repository**

Go to GitHub repo → Settings → Secrets and variables → Actions → New repository secret.

Add each secret:
- `RAILWAY_TOKEN`
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

- [ ] **Step 3: Push to main to trigger deploy workflow**

```bash
git push origin main
```

- [ ] **Step 4: Verify GitHub Actions**

1. Go to GitHub repo → Actions tab
2. Watch `CI` workflow run — all jobs should pass (lint, typecheck, test, build)
3. Watch `Deploy` workflow run — should deploy to Railway + Vercel

- [ ] **Step 5: Verify both deployments are live after CI/CD run**

```bash
curl https://<railway-url>/api/v1/health
```

Expected: 200 OK

Open `https://<vercel-url>` in browser. Expected: MedLink landing page.

---

## Task 6: Write the README

**Files:**
- Create: `README.md`

- [ ] **Step 1: Create comprehensive `README.md`**

```markdown
<div align="center">
  <h1>🏥 MedLink</h1>
  <p><strong>Healthcare Emergency Response Platform</strong></p>
  <p>Connecting patients with hospitals, blood donors, and ambulance drivers in real-time</p>

  <p>
    <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react" alt="React" />
    <img src="https://img.shields.io/badge/NestJS-10-E0234E?logo=nestjs" alt="NestJS" />
    <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql" alt="PostgreSQL" />
    <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Socket.IO-4-black?logo=socket.io" alt="Socket.IO" />
    <img src="https://img.shields.io/badge/Turborepo-monorepo-EF4444" alt="Turborepo" />
  </p>

  <p>
    <a href="https://<vercel-url>">🌐 Live Demo</a> •
    <a href="https://<railway-url>/api/docs">📄 API Docs</a>
  </p>
</div>

---

## What is MedLink?

MedLink is a production-grade healthcare emergency platform built to demonstrate full-stack engineering capability. It connects four types of users in real-time:

| Role | What they do |
|---|---|
| **Patient** | Send SOS alerts, find hospitals with available ICU beds, request blood, book doctors |
| **Hospital Admin** | Manage resources, respond to emergencies, manage doctors and bookings |
| **Blood Donor** | Toggle availability, receive blood request alerts, fulfill requests |
| **Ambulance Driver** | Go on duty, share live location, accept emergency dispatches |

## Architecture

```
medlink/                          # Turborepo monorepo
├── apps/
│   ├── web/                      # React 18 + Vite + TypeScript + Tailwind
│   └── api/                      # NestJS + TypeORM + PostgreSQL + Socket.IO
└── packages/
    └── shared/                   # Shared TypeScript types, enums, constants
```

**Frontend** → Vercel | **Backend** → Railway | **Database** → Railway PostgreSQL

Real-time updates via Socket.IO WebSocket gateway (emergency alerts, blood requests, ambulance location tracking, resource updates).

## Tech Stack

**Frontend:** React 18, Vite, TypeScript, Tailwind CSS, React Query, Zustand, React Router v6, Socket.IO client, React Hook Form + Zod, Lucide icons

**Backend:** NestJS 10, TypeScript, TypeORM, PostgreSQL 16, Socket.IO, Passport JWT, bcryptjs, class-validator, Swagger/OpenAPI

**DevOps:** Docker + Docker Compose, GitHub Actions CI/CD, Turborepo, pnpm workspaces

## Quick Start (Docker Compose)

```bash
# 1. Clone the repository
git clone https://github.com/jitendra189/medlink.git
cd medlink

# 2. Copy environment file
cp .env.example .env
# Edit .env — set your JWT_SECRET and VITE_GOOGLE_MAPS_API_KEY

# 3. Start everything with one command
docker-compose up

# 4. Seed the database
cd apps/api && pnpm seed
```

The app will be running at:
- **Frontend:** http://localhost:5173
- **API:** http://localhost:3000
- **Swagger Docs:** http://localhost:3000/api/docs

## Demo Accounts

All accounts use password: `Test@12345`

| Role | Email |
|---|---|
| Patient | amit@medlink.demo |
| Hospital Admin | apollo_hospital@medlink.demo |
| Blood Donor | kiran@medlink.demo |
| Ambulance Driver | driver1@medlink.demo |

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

# JWT — use a long random string in production
JWT_SECRET=your_secret_here
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY_DAYS=7

# Google Maps (frontend)
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

## Running Tests

```bash
# All tests across the monorepo
pnpm turbo test

# API tests only
cd apps/api && pnpm test

# Frontend tests only
cd apps/web && pnpm test

# With coverage
pnpm test -- --coverage
```

Target coverage: API ≥ 80%, Frontend ≥ 70%.

## API Documentation

Full interactive Swagger docs available at `/api/docs` (live: https://<railway-url>/api/docs).

**Endpoints summary:**
- `POST /api/v1/auth/register` — Register (patient/hospital/donor/driver)
- `POST /api/v1/auth/login` — Login → returns JWT access token
- `GET /api/v1/hospitals/nearby?lat=&lng=` — Hospitals within radius
- `POST /api/v1/emergency` — Create SOS emergency request
- `PUT /api/v1/emergency/:id/accept` — Hospital accepts emergency
- `GET /api/v1/blood/donors?bloodGroup=O%2B` — Find blood donors
- `PUT /api/v1/ambulance/location` — Driver updates live location
- ... [47 total endpoints]

## Key Features

### Real-time Emergency System
- Patient sends SOS with GPS coordinates
- Socket.IO broadcasts to all connected hospital admins instantly
- Hospital accepts → patient sees real-time status change
- Ambulance driver assigned → patient tracks live location on map

### Blood Donation Network
- Patients request blood specifying type and urgency
- Available donors matching the blood type receive instant alerts
- Donors accept and fulfill requests with full history tracking

### Hospital Resource Management
- Hospitals update ICU beds, ambulances, doctors in real-time
- Changes broadcast instantly to all connected patients
- Geospatial queries find nearest hospitals with available ICU beds

### Doctor Booking System
- Patients book appointments with specific doctors
- Hospitals confirm/complete/cancel with status tracking
- Prescriptions linked to completed bookings

## CI/CD Pipeline

Every push triggers GitHub Actions:
1. **Lint** — ESLint across all packages
2. **Typecheck** — TypeScript across all packages
3. **Test** — Jest (API) + Vitest (frontend) with PostgreSQL service container
4. **Build** — production builds verified

Merges to `main` trigger automatic deployment to Railway (API) and Vercel (frontend).

## Deployment

| Service | Platform | URL |
|---|---|---|
| Frontend | Vercel | https://<vercel-url> |
| API | Railway | https://<railway-url> |
| PostgreSQL | Railway | (managed) |

## Project Structure

```
apps/api/src/
├── auth/           # JWT auth, guards, strategies
├── users/          # User management
├── hospitals/      # Hospital search, resources
├── doctors/        # Doctor management
├── emergency/      # SOS emergency requests
├── blood/          # Blood donation & requests
├── bookings/       # Doctor/ICU bookings
├── prescriptions/  # Prescription management
├── ambulance/      # Driver duty & location
├── notifications/  # In-app notifications
├── gateways/       # Socket.IO WebSocket gateway
└── database/       # Entities, migrations, seeds

apps/web/src/
├── pages/          # Route-level components (patient/hospital/donor/driver)
├── components/     # Shared UI components + layouts
├── services/       # API call functions
├── stores/         # Zustand global state
├── lib/            # Axios, React Query, Socket.IO setup
└── router/         # React Router + protected routes
```

---

Built by [Jitendra](https://github.com/jitendra189) — showcasing production-grade full-stack engineering with TypeScript, NestJS, React, PostgreSQL, and real-time WebSocket communication.
```

Save to: `README.md`

- [ ] **Step 2: Update the live URLs in README**

Replace all `<vercel-url>` and `<railway-url>` placeholders with your actual deployment URLs.

- [ ] **Step 3: Update the Vercel rewrite URL in `apps/web/vercel.json`**

Make sure the API URL in `vercel.json` matches your actual Railway URL.

- [ ] **Step 4: Final commit**

```bash
git add README.md apps/web/vercel.json
git commit -m "docs: add comprehensive README with architecture, setup, API docs, and demo links"
```

- [ ] **Step 5: Push to GitHub**

```bash
git push origin main
```

Expected: GitHub Actions triggers CI + Deploy workflows. Both succeed.

- [ ] **Step 6: Final verification**

1. GitHub repo main page — README renders with badges and all sections
2. `https://<vercel-url>` — landing page with 4 role cards
3. Login with `amit@medlink.demo` / `Test@12345` — patient dashboard with 5 hospitals
4. `https://<railway-url>/api/docs` — Swagger with all 47 endpoints
5. GitHub Actions — CI badge green

---

## Self-Review

**Spec coverage check:**
- ✅ Seed data: 5 hospitals (Mumbai, Delhi, Bangalore, Chennai, Hyderabad), 3 patients, 6 donors, 4 drivers, 10 doctors, sample emergencies/blood requests/bookings — Task 1
- ✅ Demo accounts listed in seed output and README — Task 1
- ✅ All 47 Swagger endpoints verified — Task 2
- ✅ Railway deployment config — Task 3
- ✅ Vercel deployment config — Task 4
- ✅ GitHub Actions secrets configured — Task 5
- ✅ CI/CD pipeline triggers on push to main — Task 5
- ✅ README: project banner, live demo link, tech stack badges, architecture diagram, feature list, Quick Start, demo accounts, env vars, API docs, CI/CD, deployment table — Task 6

**Placeholder scan:** Two URLs need updating after deployment (`<vercel-url>` and `<railway-url>`). These are intentional placeholders that must be filled in after the Railway and Vercel deploys complete in Tasks 3 and 4.

**Type consistency:** Seed script imports `BCRYPT_SALT_ROUNDS` from `@medlink/shared` (same constant used in `auth.service.ts`). All enums (`Role`, `BloodGroup`, status enums) imported from `@medlink/shared` — consistent with the rest of the codebase.
```
