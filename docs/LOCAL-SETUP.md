# MedLink — Local Setup Guide

> Follow this guide to get MedLink running on any laptop from scratch.
> No prior setup assumed. Takes about 15 minutes.

---

## Prerequisites

Install these four tools first. All are free.

| Tool | Download | Why needed |
|------|----------|-----------|
| **Node.js 20+** | https://nodejs.org → click "LTS" | Runs JavaScript/TypeScript |
| **pnpm** | After Node.js: `npm install -g pnpm` | Package manager (faster than npm) |
| **Git** | https://git-scm.com/download/win | Clones the repository |
| **Docker Desktop** | https://www.docker.com/products/docker-desktop | Runs PostgreSQL database locally |

### Verify everything is installed

Open a terminal and run:
```bash
node --version     # Should show v20.x.x or higher
pnpm --version     # Should show 9.x.x or higher
git --version      # Should show git version 2.x.x
docker --version   # Should show Docker version 24.x.x or higher
```

---

## Step 1: Clone the Repository

```bash
git clone https://github.com/jitendra189/Medlink.git
cd Medlink
```

This downloads all the source code to your laptop.

---

## Step 2: Install All Dependencies

```bash
pnpm install
```

This reads `pnpm-lock.yaml` and installs all packages for all three apps (api, web, shared).
Takes 2–3 minutes on first run. Creates `node_modules/` folders.

---

## Step 3: Create Your Environment File

```bash
cp .env.example .env
```

Then open `.env` in any text editor and update these two values:

```bash
# Change this to any long random string (for local dev, anything works)
JWT_SECRET=any_long_random_string_at_least_64_chars_here_for_local_development

# Leave everything else as-is for local development
```

The other values (`DATABASE_HOST=localhost`, `DATABASE_PORT=5432`, etc.) are already correct for local Docker setup — do not change them.

---

## Step 4: Build the Shared Package

```bash
cd packages/shared && pnpm build && cd ../..
```

This compiles the shared TypeScript types into JavaScript so both the API and frontend can use them.

---

## Step 5: Build the API

```bash
cd apps/api && pnpm build && cd ../..
```

This compiles the NestJS backend into `apps/api/dist/`. Takes about 30 seconds.

---

## Step 6: Start Docker Desktop

Open **Docker Desktop** from your Start menu (Windows) or Applications (Mac).

Wait for the whale icon in the taskbar to stop animating — takes about 30 seconds.

---

## Step 7: Start the PostgreSQL Database

```bash
docker-compose up postgres -d
```

Expected output:
```
✔ Container medlink_postgres  Started
```

This starts a PostgreSQL database in a Docker container. It runs on `localhost:5432`.

---

## Step 8: Seed the Database

This populates the database with realistic Indian hospital/doctor/donor data.

```bash
cp .env apps/api/.env
cd apps/api && pnpm seed
cd ../..
rm apps/api/.env
```

Expected output:
```
✓ Connected to database
✓ Seeded 3 patients
✓ Seeded 5 hospitals
✓ Seeded 10 doctors
✓ Seeded 6 blood donors
✓ Seeded 4 ambulance drivers
✓ Seeded 2 emergency requests
✓ Seeded 2 blood requests
✓ Seeded 2 bookings

✅ Seed complete!
```

---

## Step 9: Start the API

Open a terminal and run:

```bash
node apps/api/dist/main
```

Wait for this line:
```
LOG [NestApplication] Nest application successfully started
LOG [Bootstrap] MedLink API running on port 3000
```

Keep this terminal open. The API is now running at `http://localhost:3000`.

---

## Step 10: Start the Frontend

Open a **second terminal** and run:

```bash
cd apps/web && pnpm dev
```

Wait for:
```
➜  Local:   http://localhost:5173/
```

Keep this terminal open.

---

## Step 11: Open the App

Open your browser and go to:

**http://localhost:5173**

You should see the MedLink landing page.

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

## Available URLs

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:5173 | The React web app |
| API | http://localhost:3000 | NestJS backend |
| Swagger Docs | http://localhost:3000/api/docs | Interactive API documentation |
| Health Check | http://localhost:3000/health | API status |

---

## Testing the Real-time Features

The most impressive demo — open two browser tabs:

1. **Tab 1:** Login as Patient (`amit@medlink.demo`) → go to Emergency page
2. **Tab 2:** Login as Hospital Admin (`apollo_hospital@medlink.demo`) → go to Dashboard
3. In Tab 1: Click "Send SOS Alert"
4. In Tab 2: The emergency appears **instantly** without refresh
5. Click "Accept" in Tab 2
6. In Tab 1: The status changes to "accepted" **in real-time**

---

## Running Tests

```bash
# All tests across the entire monorepo
pnpm turbo test

# API tests only (34 tests)
cd apps/api && pnpm test

# Frontend tests only
cd apps/web && pnpm test
```

---

## Stopping Everything

```bash
# Stop the database
docker-compose stop postgres

# Stop API and frontend: press Ctrl+C in each terminal
```

---

## Next Time You Start

After the first setup, starting the app is just 3 commands:

```bash
# Terminal 1 — start database
docker-compose up postgres -d

# Terminal 2 — start API
node apps/api/dist/main

# Terminal 3 — start frontend
cd apps/web && pnpm dev
```

---

## Troubleshooting

### "pnpm: command not found"
```bash
npm install -g pnpm
```

### "docker: command not found" or Docker not running
Open Docker Desktop and wait for the whale icon to stop animating.

### "Cannot connect to database"
Make sure Docker Desktop is running and the postgres container is up:
```bash
docker ps | grep postgres
```
If not running: `docker-compose up postgres -d`

### API says "JWT_SECRET environment variable is not configured"
Your `.env` file has the placeholder value. Open `.env` and replace:
```
JWT_SECRET=change_me_to_a_long_random_secret_at_least_64_chars
```
With anything long:
```
JWT_SECRET=medlink_local_dev_secret_key_2026_this_is_long_enough
```

### "Port 5432 already in use"
Another PostgreSQL is running on your machine. Either stop it or change `DATABASE_PORT` in `.env` to `5433` and update `docker-compose.yml` port mapping to `"5433:5432"`.

### "Port 3000 already in use"
Change `PORT=3001` in `.env` and restart the API.

### Frontend shows blank white page
Hard refresh the browser: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac).

### Seed fails with "relation does not exist"
The database tables haven't been created yet. Start the API first (Step 9) — it auto-creates tables on first run. Then run the seed again.

---

## If You Want to Make Code Changes

After changing any backend code:
```bash
cd apps/api && pnpm build && cd ../..
# Then restart: node apps/api/dist/main
```

For development mode with auto-restart on save:
```bash
cd apps/api && pnpm dev
```

The frontend (`pnpm dev`) already hot-reloads automatically on save — no restart needed.

---

## Deployment

Once you're ready to put the app on the internet, follow:
**[docs/DEPLOYMENT.md](./DEPLOYMENT.md)** — step-by-step Railway + Netlify guide.
