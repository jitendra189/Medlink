# MedLink — What We Built, How, and Why

> This document explains everything done in Plan 1 (the foundation) in plain language.
> No prior knowledge assumed. Every decision is explained.

---

## Table of Contents

1. [The Big Picture — What Are We Building?](#1-the-big-picture)
2. [The Folder Structure — Why This Shape?](#2-the-folder-structure)
3. [pnpm — What Is It and Why Not npm?](#3-pnpm)
4. [Turborepo — What Is It and Why?](#4-turborepo)
5. [packages/shared — The Glue Between Frontend and Backend](#5-packageshared)
6. [apps/api — The NestJS Backend](#6-appsapi)
7. [apps/web — The React Frontend](#7-appsweb)
8. [Docker and Docker Compose](#8-docker-and-docker-compose)
9. [GitHub Actions — CI/CD Pipeline](#9-github-actions)
10. [The .gitignore — What We're Hiding and Why](#10-gitignore)
11. [The Complete File List](#11-complete-file-list)
12. [What Each Config File Does](#12-what-each-config-file-does)
13. [Security Decisions Explained](#13-security-decisions-explained)
14. [What Comes Next](#14-what-comes-next)

---

## 1. The Big Picture

### What is MedLink?

MedLink is a healthcare emergency response platform. It connects four types of people:

- **Patients** — people who need help (SOS alerts, blood requests, ICU booking)
- **Hospital Admins** — manage resources (ICU beds, doctors, ambulances)
- **Blood Donors** — people who donate blood when needed
- **Ambulance Drivers** — respond to emergencies with live GPS tracking

### What kind of project is this technically?

It is a **full-stack web application**:

- A **backend API** (server that stores data and handles logic) — built with NestJS
- A **frontend** (what users see in the browser) — built with React
- A **database** (stores all the data) — PostgreSQL
- **Real-time communication** (live updates without refreshing) — Socket.IO

### Why rebuild the old version?

The old version was built as a hackathon project in 3-4 days. It worked, but it had serious problems:
- No tests — no way to know if something breaks
- Hardcoded data (doctor list written directly in the code)
- Inconsistent structure — some features worked, some were empty files
- No types shared between frontend and backend — they could drift apart
- No deployment pipeline — manual, error-prone deployment

The rebuild is designed to look like what a **senior developer at a real company** would build.

---

## 2. The Folder Structure

### What it looks like

```
medlink/                        ← Root of the project
├── apps/
│   ├── api/                    ← The backend (NestJS)
│   └── web/                    ← The frontend (React)
├── packages/
│   └── shared/                 ← Code shared between api and web
├── docs/                       ← Documentation (this file lives here)
├── .github/workflows/          ← CI/CD automation
├── package.json                ← Root config
├── pnpm-workspace.yaml         ← Tells pnpm about the workspace structure
├── turbo.json                  ← Tells Turborepo how to run tasks
├── docker-compose.yml          ← Local development with Docker
└── .env.example                ← Template for environment variables
```

### Why this shape?

This is called a **monorepo** — one Git repository that contains multiple projects (the API and the frontend). 

The alternative would be two separate repos: one for `api`, one for `web`. The problem with two repos is:

- If you change a TypeScript type in the API (like renaming `patientLat` to `lat`), you might forget to update the frontend. The code compiles but breaks at runtime.
- Shared code (like the list of blood groups: A+, A-, B+...) has to be copy-pasted into both repos and can get out of sync.

With a monorepo + `packages/shared`:
- Types are defined ONCE and imported by BOTH the API and the frontend
- When you rename something in `shared`, TypeScript immediately shows errors in every file that uses it, across both apps
- One `git clone` gets you the whole project

---

## 3. pnpm

### What is pnpm?

`pnpm` is a package manager — like `npm` but faster and smarter. It installs the JavaScript libraries your project depends on.

### Why not npm?

npm (the default) has a problem with monorepos: it installs each package's dependencies separately in every folder. So if both `apps/api` and `apps/web` use TypeScript, npm installs TypeScript twice.

pnpm uses a **workspace** approach:
- Shared dependencies are installed once
- Each package in the workspace can reference others (like `apps/api` depending on `packages/shared`)

### Key files

**`pnpm-workspace.yaml`**
```yaml
packages:
  - "apps/*"
  - "packages/*"
```
This tells pnpm: "every folder inside `apps/` and every folder inside `packages/` is a separate package in this workspace."

**Root `package.json`**
```json
{
  "name": "medlink",
  "private": true,
  "packageManager": "pnpm@9.0.0"
}
```
- `"private": true` — this root package is never published to the npm registry
- `"packageManager": "pnpm@9.0.0"` — enforces that everyone on the project uses the same pnpm version

### The `workspace:*` syntax

In `apps/api/package.json`, you'll see:
```json
"@medlink/shared": "workspace:*"
```
This means: "use `packages/shared` from this workspace, not from the internet." This is how the API imports shared types.

---

## 4. Turborepo

### What is Turborepo?

Turborepo is a **task runner** for monorepos. It knows how to run commands (like `test`, `build`, `lint`) across all your packages efficiently.

### Why not just run `npm test` in each folder manually?

With 3 packages (`shared`, `api`, `web`) you'd have to:
```bash
cd packages/shared && npm run typecheck
cd ../../apps/api && npm test
cd ../web && npm test
```

Turborepo lets you run all of that with one command from the root:
```bash
pnpm turbo test
```

### Smart caching

Turborepo is smart about caching. If you run `pnpm turbo build` and nothing has changed, it skips the build and shows "CACHED" instead. This saves time in CI (GitHub Actions).

### The `turbo.json` pipeline

```json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "test": {
      "dependsOn": ["^build"]
    }
  }
}
```

- `"dependsOn": ["^build"]` — the `^` means "run the `build` of all dependencies first." So before building `apps/api`, Turborepo builds `packages/shared` first (because api depends on shared).
- `"outputs": ["dist/**"]` — Turborepo caches the `dist/` folder. Next time nothing changed, it restores from cache instantly.

### Commands available from root

```bash
pnpm turbo build       # Build everything in correct order
pnpm turbo test        # Run all tests
pnpm turbo lint        # Lint all code
pnpm turbo typecheck   # TypeScript check all packages
pnpm turbo dev         # Start all dev servers simultaneously
```

---

## 5. packages/shared

### What is it?

`packages/shared` is a TypeScript package that contains code used by BOTH the backend and the frontend. It has:

1. **Enums** — fixed lists of values
2. **Interfaces** — TypeScript type definitions
3. **Constants** — values that never change

### Why does this matter so much?

Imagine the API returns this data:
```json
{ "role": "patient" }
```

Without shared types, the frontend developer might write:
```typescript
if (user.role === "Patient") // note capital P
```
And it would always be false because the API sends lowercase `"patient"`. This kind of bug is silent and hard to find.

With shared types:
```typescript
// packages/shared/src/enums/role.enum.ts
export enum Role {
  PATIENT = 'patient',   // the actual value stored in database
  HOSPITAL = 'hospital',
  DONOR = 'donor',
  DRIVER = 'driver',
}
```

Now both the API and the frontend import `Role.PATIENT` — same value, impossible to have a typo mismatch.

### The Enums

**`role.enum.ts`** — Who can log in
```typescript
export enum Role {
  PATIENT = 'patient',
  HOSPITAL = 'hospital',
  DONOR = 'donor',
  DRIVER = 'driver',
}
```

**`blood-group.enum.ts`** — All 8 blood types
```typescript
export enum BloodGroup {
  A_POS = 'A+',
  A_NEG = 'A-',
  B_POS = 'B+',
  B_NEG = 'B-',
  AB_POS = 'AB+',
  AB_NEG = 'AB-',
  O_POS = 'O+',
  O_NEG = 'O-',
}
```
Why store it this way? Because `A_POS` is a valid JavaScript identifier (no special characters). You write `BloodGroup.A_POS` in code and get `'A+'` as the actual value.

**`status.enum.ts`** — All the different states things can be in:
- `EmergencyStatus`: pending → accepted/rejected → resolved/cancelled
- `EmergencyType`: icu, ambulance, general
- `BloodRequestStatus`: pending → fulfilled/cancelled
- `BloodRequestUrgency`: low, medium, critical
- `BookingStatus`: pending → confirmed → completed/cancelled
- `BookingType`: doctor, icu
- `NotificationType`: emergency, blood, booking, system

### The Interfaces (Types)

**`IUser`** — What a user object looks like everywhere in the codebase:
```typescript
export interface IUser {
  id: string;
  name: string;
  email: string;
  role: Role;           // uses the Role enum above
  phone?: string;       // the ? means optional
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

**`IHospital`** — Hospital data structure
**`IEmergencyRequest`** — Emergency request structure

These are used as the "contract" between API and frontend. The API returns an `IUser`, the frontend receives an `IUser`. TypeScript enforces this.

### The Constants

```typescript
export const API_PREFIX = 'api/v1';
export const BCRYPT_SALT_ROUNDS = 12;
export const THROTTLE_TTL_SECONDS = 60;
export const THROTTLE_LIMIT = 100;
export const DEFAULT_SEARCH_RADIUS_KM = 25;
```

**Why are these in shared?** Because the backend uses `API_PREFIX` to set its URL prefix, and the frontend uses it to know what URL to call. One place, consistent everywhere.

**`BCRYPT_SALT_ROUNDS = 12`** — bcrypt is how we hash passwords. "Salt rounds" controls how hard it is to crack. 12 means 2^12 = 4096 iterations. High enough to be secure, not so high that login takes too long.

### The Socket Events constants

```typescript
export const SOCKET_EVENTS = {
  EMERGENCY_NEW: 'emergency:new',
  EMERGENCY_UPDATED: 'emergency:updated',
  BLOOD_NEW_REQUEST: 'blood:new_request',
  DRIVER_LOCATION_UPDATE: 'driver:location_update',
  // ...
} as const;
```

Socket.IO is the real-time system. When a patient sends an SOS, the server emits `'emergency:new'` and all hospital dashboards receive it instantly. 

By defining event names in shared, we guarantee that when the API emits `SOCKET_EVENTS.EMERGENCY_NEW`, the frontend listens for the exact same string. No typos, no mismatch.

### The barrel export

`packages/shared/src/index.ts` re-exports everything:
```typescript
export * from './enums/role.enum';
export * from './enums/blood-group.enum';
// ... etc
```

This means other packages only need one import:
```typescript
import { Role, BloodGroup, SOCKET_EVENTS, IUser } from '@medlink/shared';
```
Instead of importing from individual files.

---

## 6. apps/api

### What is NestJS?

NestJS is a framework for building Node.js backends. It's built on top of Express (the most popular Node.js web framework) but adds structure and TypeScript.

Why NestJS instead of plain Express?
- **Structure** — NestJS forces you to organize code into modules. Senior developers at companies love this because large Express apps become a mess.
- **Decorators** — You write `@Controller('hospitals')` and `@Get('nearby')` instead of `router.get('/hospitals/nearby', handler)`. More readable.
- **Dependency Injection** — Classes can declare what they need, and NestJS provides it automatically. This makes testing much easier.
- **Auto Swagger docs** — NestJS generates API documentation automatically from your code annotations.

### The Bootstrap (`main.ts`)

`main.ts` is the entry point — the first file that runs when you start the server.

```typescript
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // 1. Security: HTTP security headers
  app.use(helmet({ contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false }));
  
  // 2. Cookie support (for refresh tokens)
  app.use(cookieParser());
  
  // 3. CORS: only allow requests from the frontend URL
  app.enableCors({
    origin: configService.get('FRONTEND_URL', 'http://localhost:5173'),
    credentials: true,   // allow cookies to be sent
  });
  
  // 4. All routes start with /api/v1
  app.setGlobalPrefix(API_PREFIX, { exclude: ['/health'] });
  
  // 5. Validate all incoming request bodies
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,           // strip properties not in the DTO
    forbidNonWhitelisted: true, // throw error if extra properties sent
    transform: true,           // convert strings to numbers etc automatically
  }));
  
  // 6. Swagger documentation (only in development)
  if (process.env.NODE_ENV !== 'production') {
    // setup swagger...
  }
  
  await app.listen(port);
}

bootstrap().catch((err) => {
  console.error('Fatal startup error', err);
  process.exit(1);  // crash hard and visibly if startup fails
});
```

**Why each decision:**

- **`helmet()`** — Automatically sets 11 HTTP security headers. For example, it prevents clickjacking (where a bad site embeds your site in an iframe to steal clicks). Disabling CSP in development is needed because Swagger UI uses inline scripts which strict CSP blocks.

- **`cookieParser()`** — Refresh tokens are stored in httpOnly cookies (not localStorage). `cookie-parser` lets NestJS read those cookies from requests.

- **`enableCors({ credentials: true })`** — CORS (Cross-Origin Resource Sharing) controls which websites can call your API. Without this, the browser would block the frontend from calling the API. `credentials: true` is needed because we're sending cookies.

- **`setGlobalPrefix(API_PREFIX, { exclude: ['/health'] })`** — All routes get `/api/v1/` prepended. So your `@Controller('hospitals')` becomes `/api/v1/hospitals`. The health endpoint is excluded because Docker, Kubernetes, and AWS all probe `/health` (without prefix) to check if the server is alive.

- **`ValidationPipe`** — When a request comes in with `{ name: "Amit", role: "patient", hackField: "evil" }`, `whitelist: true` strips `hackField` silently. `forbidNonWhitelisted: true` instead throws a 400 error, telling the caller they sent something wrong.

### The AppModule (`app.module.ts`)

```typescript
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),   // .env file
    ThrottlerModule.forRoot([...]),              // rate limiting
    HealthModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },  // enforce rate limiting globally
  ],
})
export class AppModule {}
```

**ConfigModule** — reads your `.env` file and makes all variables available throughout the app via `ConfigService`. `isGlobal: true` means you don't have to import it in every module.

**ThrottlerModule + ThrottlerGuard** — Rate limiting. Prevents someone from hammering your API with 10,000 requests per second (DoS attack). `THROTTLE_LIMIT = 100` requests per `THROTTLE_TTL_SECONDS = 60` seconds per IP.

The important detail: `ThrottlerModule` just defines the policy. `APP_GUARD` with `ThrottlerGuard` is what actually enforces it on every request. Without the guard, rate limiting is configured but never applied — like a speed limit sign with no police.

### The Health Controller

```typescript
@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  check() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
```

This responds to `GET /health` with `{ "status": "ok", "timestamp": "..." }`.

Why does this exist? Infrastructure tools (Docker, Kubernetes, AWS Load Balancer) need a way to check if your server is running. They call `/health` every 10-30 seconds. If they get a 200 response, the server is healthy. If not, they restart it or stop sending traffic to it.

### Why the API test matters

```typescript
describe('HealthController', () => {
  it('returns ok status', () => {
    const result = controller.check();
    expect(result.status).toBe('ok');
    expect(result.timestamp).toBeDefined();
  });
});
```

This is a simple test but it's important because it validates the whole NestJS test infrastructure works. Every feature module in Plans 2 and 3 will build on this test pattern. If this test runs, Jest + ts-jest + NestJS testing module all work correctly.

### TypeScript configuration for NestJS

NestJS requires two special TypeScript settings:
```json
{
  "emitDecoratorMetadata": true,    // needed for @Injectable(), @Module() etc to work at runtime
  "experimentalDecorators": true,   // enables decorator syntax (@Something)
}
```
Without these, all the `@Controller`, `@Get`, `@Module` decorators would be syntax errors.

---

## 7. apps/web

### What is Vite?

Vite is a build tool for frontend applications. It:
- Starts a dev server instantly (in milliseconds, not seconds like older tools)
- Bundles your TypeScript/React code into plain HTML/CSS/JS for the browser
- Handles hot module replacement — when you save a file, the browser updates instantly without full reload

### What is React?

React is a JavaScript library for building user interfaces. Instead of writing HTML directly, you write **components** — reusable pieces of UI.

```tsx
// A component
export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <h1 className="text-4xl font-bold text-blue-600">MedLink</h1>
    </div>
  );
}
```

That `className="text-4xl..."` is Tailwind CSS — utility classes that apply styles directly.

### What is Tailwind CSS?

Tailwind is a CSS framework where instead of writing:
```css
.title { font-size: 2.25rem; font-weight: 700; color: #2563eb; }
```
You write classes directly in HTML/JSX:
```html
<h1 class="text-4xl font-bold text-blue-600">MedLink</h1>
```

Why? It's faster to write, easier to see the styles at a glance, and no naming conflicts.

### What is Vitest?

Vitest is the test runner for the frontend. It's like Jest but built for Vite — much faster startup.

The test:
```typescript
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders MedLink heading', () => {
    render(<App />);
    expect(screen.getByText('MedLink')).toBeInTheDocument();
  });
});
```

`render(<App />)` renders the React component into a fake DOM (not a real browser). `screen.getByText('MedLink')` finds the element. `toBeInTheDocument()` asserts it exists. This tests that the component actually renders without crashing.

### The `vite.config.ts` proxy

```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3000',
      changeOrigin: true,
    },
  },
},
```

During development, the React app runs on port 5173 and the API runs on port 3000. Normally the browser would block calls from one port to another (CORS). The proxy fixes this: when the React app calls `/api/v1/hospitals`, Vite silently forwards it to `http://localhost:3000/api/v1/hospitals`. From the browser's perspective, it's all on port 5173.

### The `@medlink/shared` alias

```typescript
resolve: {
  alias: {
    '@medlink/shared': path.resolve(__dirname, '../../packages/shared/src/index.ts'),
  },
},
```

This tells Vite: "when React code imports from `@medlink/shared`, find it at `packages/shared/src/index.ts`." This is how the frontend uses the same types and enums as the backend.

---

## 8. Docker and Docker Compose

### What is Docker?

Docker packages your application into a **container** — a lightweight, self-contained environment that includes your code, Node.js runtime, and all dependencies. 

The benefit: if it works in a Docker container on your laptop, it works exactly the same on a server in the cloud or on a colleague's machine. No more "it works on my machine."

### What is Docker Compose?

Docker Compose lets you run multiple containers together with one command. MedLink needs three things to run:
1. PostgreSQL database
2. The NestJS API
3. The React frontend (served by nginx)

Instead of starting each manually, you run:
```bash
docker-compose up
```
And all three start together, correctly configured.

### The `docker-compose.yml` explained

```yaml
services:
  postgres:
    image: postgres:16-alpine       # Official PostgreSQL 16 image (alpine = tiny)
    ports:
      - '5432:5432'                 # host:container — forward port 5432
    environment:
      POSTGRES_DB: ${DATABASE_NAME:-medlink}    # use .env value or default "medlink"
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready ...']    # check if postgres is ready
      interval: 10s
      retries: 5

  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile    # build from this Dockerfile
    depends_on:
      postgres:
        condition: service_healthy        # wait until postgres passes healthcheck
    environment:
      DATABASE_HOST: postgres             # "postgres" is the hostname inside Docker network

  web:
    build:
      dockerfile: apps/web/Dockerfile
    ports:
      - '5173:80'    # map host port 5173 to nginx port 80 inside container
    depends_on:
      - api
```

Key insight: Inside the Docker network, services find each other by **service name**. So the API connects to `DATABASE_HOST: postgres` — the name of the postgres service — not `localhost`. Outside Docker, you access postgres at `localhost:5432`.

### The Multi-Stage Dockerfile (API)

```dockerfile
# Stage 1: Install dependencies
FROM node:20-alpine AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/
RUN pnpm install --frozen-lockfile

# Stage 2: Build the TypeScript
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules    # copy installed deps
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api
RUN pnpm --filter @medlink/api build                 # compile TypeScript → JavaScript

# Stage 3: Production image (smallest possible)
FROM node:20-alpine AS runner
ENV NODE_ENV=production
COPY --from=builder /app/apps/api/dist ./dist        # only the compiled output
COPY --from=builder /app/node_modules ./node_modules
CMD ["node", "dist/main"]                            # run the compiled JavaScript
```

Why multi-stage? Because development tools (TypeScript compiler, test framework, etc.) are only needed during the build. The final production image only contains the compiled JavaScript and production dependencies. This makes it:
- **Smaller** (less data to transfer to the server)
- **Safer** (no build tools that could be exploited)

### nginx for the frontend

The web Dockerfile compiles React into static files (HTML, CSS, JS), then serves them with nginx. nginx is a high-performance web server — much better than Vite for serving production files.

The `nginx.conf` includes:
```nginx
location / {
    try_files $uri $uri/ /index.html;    # SPA routing fix
}

location /api {
    proxy_pass http://api:3000;          # forward API calls to the API container
}
```

**"SPA routing fix"** — React is a Single Page Application. When you visit `http://myapp.com/patient/dashboard`, nginx doesn't have a file at that path. Without `try_files ... /index.html`, nginx returns 404. With it, nginx serves `index.html` and React's router renders the right page.

---

## 9. GitHub Actions

### What is CI/CD?

- **CI (Continuous Integration)** — Every time you push code to GitHub, automated checks run: tests, linting, type checking, build. If any fail, you know immediately. This prevents broken code from being merged.
- **CD (Continuous Deployment)** — When code is merged to main, it's automatically deployed to production. No manual steps.

### The CI workflow (`.github/workflows/ci.yml`)

Runs on every push to every branch and every PR to main.

```yaml
jobs:
  ci:
    runs-on: ubuntu-latest         # fresh Linux machine every time

    services:
      postgres:
        image: postgres:16-alpine  # real PostgreSQL for integration tests
        ports: - 5432:5432

    steps:
      - uses: actions/checkout@v4          # download your code
      - uses: pnpm/action-setup@v4         # install pnpm
      - uses: actions/setup-node@v4        # install Node.js 20
        with:
          cache: 'pnpm'                    # cache node_modules for speed

      - name: Install dependencies
        run: pnpm install --frozen-lockfile # exact versions from lockfile

      - name: Lint        → pnpm turbo lint
      - name: Typecheck   → pnpm turbo typecheck
      - name: Test        → pnpm turbo test  (with real PostgreSQL)
      - name: Build       → pnpm turbo build
```

**Why `--frozen-lockfile`?** The lockfile (`pnpm-lock.yaml`) records the exact version of every package. `--frozen-lockfile` means "use exactly these versions, fail if the lockfile is outdated." This prevents the "worked yesterday, broken today because a dependency auto-updated" problem.

**Why a real PostgreSQL service in CI?** Because integration tests against a real database catch bugs that mocked databases miss. Example: if your SQL query has a typo, a mock database returns fake data anyway. A real database throws an error.

### The Deploy workflow (`.github/workflows/deploy.yml`)

Runs only when code is merged to `main`.

```yaml
steps:
  - Build everything
  
  - name: Deploy API to Railway
    uses: bervProject/railway-deploy@main
    with:
      railway_token: ${{ secrets.RAILWAY_TOKEN }}   # secret stored in GitHub
      service: medlink-api

  - name: Deploy Web to Vercel
    uses: amondnet/vercel-action@v25
    with:
      vercel-token: ${{ secrets.VERCEL_TOKEN }}
      vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

**Secrets** — Tokens and keys are stored in GitHub repository settings (Settings → Secrets), never in code. The `${{ secrets.RAILWAY_TOKEN }}` syntax reads them at runtime. This way, your tokens are never visible in the codebase.

**Railway** — Cloud platform where the NestJS API and PostgreSQL database are hosted.

**Vercel** — Platform optimized for frontend deployments. Detects Vite automatically, builds, and deploys in seconds.

---

## 10. .gitignore

What we're hiding from git and why:

```
node_modules/     ← Installed packages (100MB+, regenerated from package.json)
dist/             ← Compiled output (regenerated by build)
build/            ← Same as dist
.turbo/           ← Turborepo cache files
.env              ← SECRET — contains database passwords, JWT secret
.env.*            ← Other env files (.env.local, .env.staging) — also secrets
!.env.example     ← Exception: the TEMPLATE (no real secrets) IS committed
.DS_Store         ← macOS metadata files, useless for others
coverage/         ← Test coverage reports (regenerated by tests)
*.log             ← Log files
.superpowers/     ← Tool-specific directory
.vscode/          ← Editor settings (personal, not project)
.idea/            ← JetBrains editor settings
Thumbs.db         ← Windows thumbnail cache
```

**The critical one: `.env`**

Your `.env` file contains:
```
JWT_SECRET=some_very_secret_key
DATABASE_PASSWORD=your_real_password
```

If this was committed to GitHub and the repo was public, anyone could steal your database password and forge JWT tokens to log in as any user. The `.gitignore` prevents this from happening accidentally.

The `.env.example` IS committed — it's the template showing what variables exist, with placeholder values:
```
JWT_SECRET=change_me_to_a_long_random_secret_at_least_64_chars
DATABASE_PASSWORD=medlink_pass
```

A new developer clones the repo, copies `.env.example` to `.env`, fills in real values, and is ready to go.

---

## 11. Complete File List

Every file created in Plan 1:

```
medlink/
├── package.json                           ← Workspace root
├── pnpm-workspace.yaml                    ← Workspace definition
├── pnpm-lock.yaml                         ← Exact dependency versions (auto-generated)
├── turbo.json                             ← Task pipeline config
├── .gitignore                             ← Files to hide from git
├── .env.example                           ← Env variable template
├── docker-compose.yml                     ← Local dev with Docker
├── docker-compose.prod.yml                ← Production Docker config
│
├── packages/
│   └── shared/
│       ├── package.json                   ← @medlink/shared package config
│       ├── tsconfig.json                  ← TypeScript config for shared
│       └── src/
│           ├── index.ts                   ← Barrel export (exports everything)
│           ├── enums/
│           │   ├── role.enum.ts           ← Role: PATIENT, HOSPITAL, DONOR, DRIVER
│           │   ├── blood-group.enum.ts    ← BloodGroup: A+, A-, B+, B-, AB+, AB-, O+, O-
│           │   └── status.enum.ts        ← All status enums
│           ├── types/
│           │   ├── user.types.ts          ← IUser interface
│           │   ├── hospital.types.ts      ← IHospital, IDoctor interfaces
│           │   └── emergency.types.ts     ← IEmergencyRequest interface
│           └── constants/
│               └── app.constants.ts       ← API_PREFIX, SOCKET_EVENTS, etc.
│
├── apps/
│   ├── api/
│   │   ├── package.json                   ← @medlink/api dependencies
│   │   ├── tsconfig.json                  ← TS config (emitDecoratorMetadata, paths)
│   │   ├── tsconfig.build.json            ← TS config for production build
│   │   ├── nest-cli.json                  ← NestJS CLI config
│   │   ├── .eslintrc.cjs                  ← Lint rules
│   │   ├── Dockerfile                     ← Multi-stage Docker build
│   │   └── src/
│   │       ├── main.ts                    ← App entry point (bootstrap)
│   │       ├── app.module.ts              ← Root NestJS module
│   │       └── health/
│   │           ├── health.module.ts       ← Health module
│   │           ├── health.controller.ts   ← GET /health → {status: 'ok'}
│   │           └── health.controller.spec.ts ← Test for health endpoint
│   │
│   └── web/
│       ├── package.json                   ← @medlink/web dependencies
│       ├── tsconfig.json                  ← TS config for React
│       ├── tsconfig.node.json             ← TS config for Vite config files
│       ├── vite.config.ts                 ← Vite build config + test config
│       ├── tailwind.config.ts             ← Tailwind theme config
│       ├── postcss.config.js              ← PostCSS config (required by Tailwind)
│       ├── .eslintrc.cjs                  ← Lint rules
│       ├── index.html                     ← HTML entry point
│       ├── nginx.conf                     ← nginx config for production
│       ├── Dockerfile                     ← Multi-stage Docker build
│       └── src/
│           ├── main.tsx                   ← React entry point
│           ├── App.tsx                    ← Root App component (placeholder)
│           ├── index.css                  ← Tailwind CSS imports
│           ├── test-setup.ts              ← Vitest setup (jest-dom matchers)
│           └── App.test.tsx               ← Test: App renders "MedLink"
│
└── .github/
    └── workflows/
        ├── ci.yml                         ← Run tests on every push
        └── deploy.yml                     ← Deploy to Railway + Vercel on merge to main
```

---

## 12. What Each Config File Does

### `tsconfig.json` (TypeScript Config)

TypeScript needs to know how to compile your code. Key settings:

| Setting | What it does |
|---|---|
| `"strict": true` | Enables all strict type checks. Catches more bugs at compile time. |
| `"emitDecoratorMetadata": true` | Required for NestJS decorators to work at runtime. |
| `"moduleResolution": "bundler"` | Modern resolution strategy for Vite/Vitest. |
| `"paths": {"@medlink/shared": [...]}` | Tells TS where to find the shared package. |
| `"noUnusedLocals": true` | Error if you declare a variable and never use it. |
| `"skipLibCheck": true` | Don't type-check files in node_modules (speeds up compilation). |

### `nest-cli.json` (NestJS CLI Config)

```json
{
  "sourceRoot": "src",           ← where your source code is
  "compilerOptions": {
    "deleteOutDir": true         ← clean dist/ before each build
  }
}
```

### `postcss.config.js` (PostCSS Config)

PostCSS processes your CSS. Tailwind CSS is a PostCSS plugin — it reads your HTML/JSX to find which classes you use and generates only those CSS rules. Autoprefixer adds browser vendor prefixes (-webkit-, -moz-) automatically.

---

## 13. Security Decisions Explained

### Why httpOnly cookies for refresh tokens?

There are two places to store tokens in a browser: **localStorage** and **httpOnly cookies**.

- **localStorage**: JavaScript can read it. If there's any XSS (cross-site scripting) vulnerability anywhere on your site, an attacker can steal the token with `localStorage.getItem('token')`.
- **httpOnly cookies**: JavaScript CANNOT read them. The browser sends them automatically with requests, but `document.cookie` can't access them. Much safer.

So: access tokens (short-lived, 15 minutes) are in memory / response body. Refresh tokens (long-lived, 7 days) are in httpOnly cookies.

### Why `whitelist: true` and `forbidNonWhitelisted: true`?

**Without**: A user could send `{ "email": "x@x.com", "isAdmin": true }` and if your code didn't check, the extra field could cause problems.

**With whitelist**: Any field not defined in your DTO class is stripped before it reaches your handler. `isAdmin` disappears.

**With forbidNonWhitelisted**: Instead of silently stripping, it throws a 400 Bad Request. This teaches API clients to send correct data.

### Why `BCRYPT_SALT_ROUNDS = 12`?

When a user registers, we never store their plain password. We store a hash:
```
"Test@12345" → bcrypt → "$2a$12$abc123def456..."
```

The number 12 is the "cost factor" — it means 2^12 = 4096 hash iterations. This makes it very slow (intentionally) to brute-force crack. An attacker who steals the database can only try about 10-20 passwords per second at this cost, making cracking infeasible.

### Why CORS restricted to `FRONTEND_URL`?

Without CORS: any website anywhere can make API calls as if they were the user. A malicious site `evil.com` could call `api.medlink.com/emergency` pretending to be you.

With CORS: only requests from `FRONTEND_URL` (your React app) are allowed. Requests from `evil.com` are blocked by the browser.

---

## 14. What Comes Next

The foundation (Plan 1) is complete. Here is what the remaining 4 plans build on top of it:

### Plan 2 — Database + Auth (next to build)

- Connect to PostgreSQL using TypeORM
- Create all 11 database tables as TypeScript entity classes
- Implement JWT authentication: register → login → refresh token → logout → `/me`
- Every user password hashed with bcrypt, every request validated

### Plan 3 — All API Feature Modules

- Hospitals: list, search nearby by GPS, update resources
- Doctors: add/update/remove doctors per hospital
- Emergency: SOS requests, hospital accept/reject/resolve
- Blood: donor search, blood requests, availability toggle
- Bookings: doctor and ICU appointment booking
- Prescriptions: issue and view prescriptions
- Ambulance: driver duty toggle, live location, dispatch
- Notifications: in-app notification system
- Socket.IO gateway: real-time updates for all the above

### Plan 4 — React Frontend

- Login, Register pages with form validation
- Patient dashboard with SOS button, hospital map, blood request
- Hospital dashboard with emergency queue (real-time alerts)
- Donor dashboard with blood request alerts
- Driver dashboard with live location sharing and navigation

### Plan 5 — Deploy and Documentation

- Fill the database with realistic test data (hospitals in Mumbai, Delhi, Bangalore, etc.)
- Deploy API to Railway, frontend to Vercel
- Configure GitHub Actions secrets for automated deployment
- Write the README that showcases this project to companies

---

## Summary

What we've built so far is the **skeleton of a production-grade full-stack project**:

- ✅ One command to install everything (`pnpm install`)
- ✅ One command to run all tests (`pnpm turbo test`)
- ✅ One command to start locally (`docker-compose up`)
- ✅ Automatic tests run on every push to GitHub
- ✅ Automatic deployment wired up (just needs secrets configured)
- ✅ TypeScript everywhere — frontend and backend share the same types
- ✅ Security foundations in place (CORS, Helmet, rate limiting, httpOnly cookies)

When a senior developer at a company reviews this repository, they will see someone who understands why each tool exists, not just how to use it.
