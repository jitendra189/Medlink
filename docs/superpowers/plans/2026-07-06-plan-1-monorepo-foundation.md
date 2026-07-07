# MedLink Plan 1: Monorepo Foundation + Shared Package + Infrastructure

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold the Turborepo monorepo with working `apps/web`, `apps/api`, and `packages/shared`, wired together with Docker Compose for local dev and GitHub Actions for CI/CD — so every subsequent plan builds on a solid, runnable foundation.

**Architecture:** Turborepo monorepo at the repo root. `packages/shared` publishes TypeScript types/enums/constants consumed by both apps. `apps/api` is a bare NestJS app (no features yet — just bootstrap). `apps/web` is a bare Vite+React app (no pages yet — just bootstrap). Docker Compose runs postgres + api + web with one command.

**Tech Stack:** Turborepo, Node 20, pnpm workspaces, NestJS 10, React 18, Vite 5, TypeScript 5, Tailwind CSS 3, Docker, Docker Compose, GitHub Actions

---

## File Map

### Root
- Create: `package.json` — pnpm workspace root
- Create: `pnpm-workspace.yaml` — declares apps/* and packages/*
- Create: `turbo.json` — pipeline: lint, typecheck, test, build
- Create: `.gitignore`
- Create: `.env.example`
- Create: `docker-compose.yml`
- Create: `docker-compose.prod.yml`
- Create: `.github/workflows/ci.yml`
- Create: `.github/workflows/deploy.yml`

### packages/shared
- Create: `packages/shared/package.json`
- Create: `packages/shared/tsconfig.json`
- Create: `packages/shared/src/index.ts` — barrel export
- Create: `packages/shared/src/enums/role.enum.ts`
- Create: `packages/shared/src/enums/blood-group.enum.ts`
- Create: `packages/shared/src/enums/status.enum.ts`
- Create: `packages/shared/src/types/user.types.ts`
- Create: `packages/shared/src/types/hospital.types.ts`
- Create: `packages/shared/src/types/emergency.types.ts`
- Create: `packages/shared/src/constants/app.constants.ts`

### apps/api
- Create: `apps/api/package.json`
- Create: `apps/api/tsconfig.json`
- Create: `apps/api/tsconfig.build.json`
- Create: `apps/api/nest-cli.json`
- Create: `apps/api/.eslintrc.js`
- Create: `apps/api/Dockerfile`
- Create: `apps/api/src/main.ts` — bootstrap NestJS with Swagger, CORS, ValidationPipe, Helmet
- Create: `apps/api/src/app.module.ts` — root module (no feature modules yet)
- Create: `apps/api/src/health/health.controller.ts` — GET /health → { status: 'ok' }
- Create: `apps/api/src/health/health.module.ts`

### apps/web
- Create: `apps/web/package.json`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/tsconfig.node.json`
- Create: `apps/web/vite.config.ts`
- Create: `apps/web/tailwind.config.ts`
- Create: `apps/web/postcss.config.js`
- Create: `apps/web/.eslintrc.cjs`
- Create: `apps/web/index.html`
- Create: `apps/web/Dockerfile`
- Create: `apps/web/src/main.tsx` — React root mount
- Create: `apps/web/src/App.tsx` — placeholder "MedLink is coming" page
- Create: `apps/web/src/index.css` — Tailwind directives

---

## Task 1: Initialise pnpm workspace root

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `.gitignore`

- [ ] **Step 1: Create root `package.json`**

```json
{
  "name": "medlink",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "test": "turbo test",
    "lint": "turbo lint",
    "typecheck": "turbo typecheck",
    "format": "prettier --write \"**/*.{ts,tsx,json,md}\""
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "prettier": "^3.3.0",
    "typescript": "^5.5.0"
  },
  "engines": {
    "node": ">=20.0.0",
    "pnpm": ">=9.0.0"
  },
  "packageManager": "pnpm@9.0.0"
}
```

Save to: `package.json`

- [ ] **Step 2: Create `pnpm-workspace.yaml`**

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

Save to: `pnpm-workspace.yaml`

- [ ] **Step 3: Create `.gitignore`**

```
node_modules/
dist/
build/
.turbo/
*.env
!.env.example
.DS_Store
coverage/
.nyc_output/
*.log
.superpowers/
```

Save to: `.gitignore`

- [ ] **Step 4: Install pnpm globally if not present, then install workspace**

```bash
npm install -g pnpm@9
pnpm install
```

Expected: `node_modules/` created at root, no errors.

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-workspace.yaml .gitignore
git commit -m "chore: initialise pnpm workspace root"
```

---

## Task 2: Add Turborepo pipeline

**Files:**
- Create: `turbo.json`

- [ ] **Step 1: Create `turbo.json`**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "ui": "tui",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": ["$TURBO_DEFAULT$", ".env*"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["^build"],
      "inputs": ["$TURBO_DEFAULT$"],
      "outputs": ["coverage/**"]
    },
    "lint": {
      "inputs": ["$TURBO_DEFAULT$"]
    },
    "typecheck": {
      "inputs": ["$TURBO_DEFAULT$"]
    }
  }
}
```

Save to: `turbo.json`

- [ ] **Step 2: Install turbo**

```bash
pnpm add -w turbo@latest
```

Expected: turbo added to root devDependencies.

- [ ] **Step 3: Commit**

```bash
git add turbo.json package.json pnpm-lock.yaml
git commit -m "chore: add turborepo pipeline config"
```

---

## Task 3: Scaffold `packages/shared`

**Files:**
- Create: `packages/shared/package.json`
- Create: `packages/shared/tsconfig.json`
- Create: `packages/shared/src/enums/role.enum.ts`
- Create: `packages/shared/src/enums/blood-group.enum.ts`
- Create: `packages/shared/src/enums/status.enum.ts`
- Create: `packages/shared/src/types/user.types.ts`
- Create: `packages/shared/src/types/hospital.types.ts`
- Create: `packages/shared/src/types/emergency.types.ts`
- Create: `packages/shared/src/constants/app.constants.ts`
- Create: `packages/shared/src/index.ts`

- [ ] **Step 1: Create `packages/shared/package.json`**

```json
{
  "name": "@medlink/shared",
  "version": "1.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "^5.5.0"
  }
}
```

Save to: `packages/shared/package.json`

- [ ] **Step 2: Create `packages/shared/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "skipLibCheck": true,
    "declaration": true,
    "esModuleInterop": true
  },
  "include": ["src"]
}
```

Save to: `packages/shared/tsconfig.json`

- [ ] **Step 3: Create role enum**

```typescript
export enum Role {
  PATIENT = 'patient',
  HOSPITAL = 'hospital',
  DONOR = 'donor',
  DRIVER = 'driver',
}
```

Save to: `packages/shared/src/enums/role.enum.ts`

- [ ] **Step 4: Create blood group enum**

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

Save to: `packages/shared/src/enums/blood-group.enum.ts`

- [ ] **Step 5: Create status enums**

```typescript
export enum EmergencyStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
  RESOLVED = 'resolved',
}

export enum EmergencyType {
  ICU = 'icu',
  AMBULANCE = 'ambulance',
  GENERAL = 'general',
}

export enum BloodRequestStatus {
  PENDING = 'pending',
  FULFILLED = 'fulfilled',
  CANCELLED = 'cancelled',
}

export enum BloodRequestUrgency {
  LOW = 'low',
  MEDIUM = 'medium',
  CRITICAL = 'critical',
}

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

export enum BookingType {
  DOCTOR = 'doctor',
  ICU = 'icu',
}

export enum NotificationType {
  EMERGENCY = 'emergency',
  BLOOD = 'blood',
  BOOKING = 'booking',
  SYSTEM = 'system',
}
```

Save to: `packages/shared/src/enums/status.enum.ts`

- [ ] **Step 6: Create user types**

```typescript
import { Role } from '../enums/role.enum';

export interface IUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string;
  avatarUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

Save to: `packages/shared/src/types/user.types.ts`

- [ ] **Step 7: Create hospital types**

```typescript
export interface IHospital {
  id: string;
  userId: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  phone?: string;
  latitude?: number;
  longitude?: number;
  icuBedsTotal: number;
  icuBedsAvailable: number;
  totalDoctors: number;
  ambulancesTotal: number;
  ambulancesAvailable: number;
  rating: number;
  photoUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDoctor {
  id: string;
  hospitalId: string;
  name: string;
  speciality?: string;
  phone?: string;
  isAvailable: boolean;
}
```

Save to: `packages/shared/src/types/hospital.types.ts`

- [ ] **Step 8: Create emergency types**

```typescript
import { EmergencyStatus, EmergencyType } from '../enums/status.enum';

export interface IEmergencyRequest {
  id: string;
  patientId: string;
  hospitalId?: string;
  driverId?: string;
  type: EmergencyType;
  status: EmergencyStatus;
  patientLat: number;
  patientLng: number;
  description?: string;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

Save to: `packages/shared/src/types/emergency.types.ts`

- [ ] **Step 9: Create app constants**

```typescript
export const APP_NAME = 'MedLink';
export const API_PREFIX = 'api/v1';
export const DEFAULT_SEARCH_RADIUS_KM = 25;
export const MAX_SEARCH_RADIUS_KM = 100;
export const ACCESS_TOKEN_EXPIRY = '15m';
export const REFRESH_TOKEN_EXPIRY_DAYS = 7;
export const BCRYPT_SALT_ROUNDS = 12;
export const THROTTLE_TTL_SECONDS = 60;
export const THROTTLE_LIMIT = 100;
export const AUTH_THROTTLE_LIMIT = 10;

export const SOCKET_EVENTS = {
  EMERGENCY_NEW: 'emergency:new',
  EMERGENCY_UPDATED: 'emergency:updated',
  EMERGENCY_DRIVER_DISPATCHED: 'emergency:driver_dispatched',
  BLOOD_NEW_REQUEST: 'blood:new_request',
  BLOOD_REQUEST_FULFILLED: 'blood:request_fulfilled',
  DRIVER_LOCATION_UPDATE: 'driver:location_update',
  DRIVER_LOCATION_BROADCAST: 'driver:location_broadcast',
  HOSPITAL_RESOURCE_UPDATE: 'hospital:resource_update',
  NOTIFICATION_NEW: 'notification:new',
} as const;

export const SOCKET_ROOMS = {
  HOSPITALS: 'hospitals',
  DONORS: 'donors',
  PATIENT: (id: string) => `patient:${id}`,
  HOSPITAL: (id: string) => `hospital:${id}`,
  DRIVER: (id: string) => `driver:${id}`,
} as const;
```

Save to: `packages/shared/src/constants/app.constants.ts`

- [ ] **Step 10: Create barrel export**

```typescript
export * from './enums/role.enum';
export * from './enums/blood-group.enum';
export * from './enums/status.enum';
export * from './types/user.types';
export * from './types/hospital.types';
export * from './types/emergency.types';
export * from './constants/app.constants';
```

Save to: `packages/shared/src/index.ts`

- [ ] **Step 11: Run typecheck**

```bash
cd packages/shared && pnpm typecheck
```

Expected: No errors.

- [ ] **Step 12: Commit**

```bash
git add packages/shared/
git commit -m "feat(shared): scaffold shared package with enums, types, constants"
```

---

## Task 4: Scaffold `apps/api` (bare NestJS bootstrap)

**Files:**
- Create: `apps/api/package.json`
- Create: `apps/api/tsconfig.json`
- Create: `apps/api/tsconfig.build.json`
- Create: `apps/api/nest-cli.json`
- Create: `apps/api/src/main.ts`
- Create: `apps/api/src/app.module.ts`
- Create: `apps/api/src/health/health.controller.ts`
- Create: `apps/api/src/health/health.module.ts`

- [ ] **Step 1: Create `apps/api/package.json`**

```json
{
  "name": "@medlink/api",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "nest start --watch",
    "build": "nest build",
    "start": "node dist/main",
    "test": "jest --coverage",
    "test:watch": "jest --watch",
    "lint": "eslint \"{src,test}/**/*.ts\" --fix",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@medlink/shared": "workspace:*",
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/platform-express": "^10.0.0",
    "@nestjs/swagger": "^7.0.0",
    "@nestjs/config": "^3.0.0",
    "@nestjs/throttler": "^5.0.0",
    "@nestjs/jwt": "^10.0.0",
    "@nestjs/passport": "^10.0.0",
    "@nestjs/typeorm": "^10.0.0",
    "typeorm": "^0.3.20",
    "pg": "^8.12.0",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.1",
    "bcryptjs": "^3.0.0",
    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.1",
    "cookie-parser": "^1.4.6",
    "helmet": "^7.0.0",
    "socket.io": "^4.7.5",
    "@nestjs/websockets": "^10.0.0",
    "@nestjs/platform-socket.io": "^10.0.0",
    "reflect-metadata": "^0.2.0",
    "rxjs": "^7.8.0"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.0.0",
    "@nestjs/testing": "^10.0.0",
    "@types/express": "^4.17.0",
    "@types/node": "^20.0.0",
    "@types/passport-jwt": "^4.0.0",
    "@types/bcryptjs": "^2.4.0",
    "@types/cookie-parser": "^1.4.7",
    "@types/jest": "^29.5.0",
    "@types/supertest": "^6.0.0",
    "jest": "^29.7.0",
    "supertest": "^7.0.0",
    "ts-jest": "^29.2.0",
    "ts-node": "^10.9.0",
    "typescript": "^5.5.0"
  },
  "jest": {
    "moduleFileExtensions": ["js", "json", "ts"],
    "rootDir": "src",
    "testRegex": ".*\\.spec\\.ts$",
    "transform": { "^.+\\.(t|j)s$": "ts-jest" },
    "collectCoverageFrom": ["**/*.(t|j)s", "!**/*.module.ts", "!**/main.ts"],
    "coverageDirectory": "../coverage",
    "testEnvironment": "node",
    "coverageThreshold": { "global": { "lines": 80 } }
  }
}
```

Save to: `apps/api/package.json`

- [ ] **Step 2: Create `apps/api/tsconfig.json`**

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2021",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strictNullChecks": true,
    "noImplicitAny": true,
    "strictBindCallApply": true,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true,
    "paths": {
      "@medlink/shared": ["../../packages/shared/src/index.ts"]
    }
  }
}
```

Save to: `apps/api/tsconfig.json`

- [ ] **Step 3: Create `apps/api/tsconfig.build.json`**

```json
{
  "extends": "./tsconfig.json",
  "exclude": ["node_modules", "dist", "**/*.spec.ts"]
}
```

Save to: `apps/api/tsconfig.build.json`

- [ ] **Step 4: Create `apps/api/nest-cli.json`**

```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true
  }
}
```

Save to: `apps/api/nest-cli.json`

- [ ] **Step 5: Create `apps/api/src/health/health.controller.ts`**

```typescript
import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Health check' })
  check() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
```

Save to: `apps/api/src/health/health.controller.ts`

- [ ] **Step 6: Create `apps/api/src/health/health.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';

@Module({ controllers: [HealthController] })
export class HealthModule {}
```

Save to: `apps/api/src/health/health.module.ts`

- [ ] **Step 7: Create `apps/api/src/app.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { HealthModule } from './health/health.module';
import { THROTTLE_TTL_SECONDS, THROTTLE_LIMIT } from '@medlink/shared';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      { ttl: THROTTLE_TTL_SECONDS * 1000, limit: THROTTLE_LIMIT },
    ]),
    HealthModule,
  ],
})
export class AppModule {}
```

Save to: `apps/api/src/app.module.ts`

- [ ] **Step 8: Create `apps/api/src/main.ts`**

```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { API_PREFIX } from '@medlink/shared';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.use(helmet());
  app.use(cookieParser());

  app.enableCors({
    origin: configService.get<string>('FRONTEND_URL', 'http://localhost:5173'),
    credentials: true,
  });

  app.setGlobalPrefix(API_PREFIX);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('MedLink API')
    .setDescription('Healthcare emergency response platform API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);
  console.log(`MedLink API running on http://localhost:${port}`);
  console.log(`Swagger docs: http://localhost:${port}/api/docs`);
}

bootstrap();
```

Save to: `apps/api/src/main.ts`

- [ ] **Step 9: Install api dependencies**

```bash
cd apps/api && pnpm install
```

Expected: All packages installed, no peer dependency errors.

- [ ] **Step 10: Write health controller test**

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();
    controller = module.get<HealthController>(HealthController);
  });

  it('returns ok status', () => {
    const result = controller.check();
    expect(result.status).toBe('ok');
    expect(result.timestamp).toBeDefined();
  });
});
```

Save to: `apps/api/src/health/health.controller.spec.ts`

- [ ] **Step 11: Run test — verify it passes**

```bash
cd apps/api && pnpm test
```

Expected: `PASS src/health/health.controller.spec.ts`

- [ ] **Step 12: Commit**

```bash
git add apps/api/
git commit -m "feat(api): bootstrap NestJS app with health endpoint, Swagger, ValidationPipe"
```

---

## Task 5: Scaffold `apps/web` (bare React+Vite bootstrap)

**Files:**
- Create: `apps/web/package.json`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/tsconfig.node.json`
- Create: `apps/web/vite.config.ts`
- Create: `apps/web/tailwind.config.ts`
- Create: `apps/web/postcss.config.js`
- Create: `apps/web/index.html`
- Create: `apps/web/src/main.tsx`
- Create: `apps/web/src/App.tsx`
- Create: `apps/web/src/index.css`

- [ ] **Step 1: Create `apps/web/package.json`**

```json
{
  "name": "@medlink/web",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest run --coverage",
    "test:watch": "vitest",
    "lint": "eslint src --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@medlink/shared": "workspace:*",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "react-router-dom": "^6.26.0",
    "@tanstack/react-query": "^5.51.0",
    "zustand": "^4.5.0",
    "socket.io-client": "^4.7.5",
    "axios": "^1.7.0",
    "react-hook-form": "^7.52.0",
    "@hookform/resolvers": "^3.9.0",
    "zod": "^3.23.0",
    "lucide-react": "^0.400.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.4.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "vite": "^5.3.0",
    "typescript": "^5.5.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "vitest": "^2.0.0",
    "@vitest/coverage-v8": "^2.0.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/jest-dom": "^6.4.0",
    "jsdom": "^24.0.0"
  }
}
```

Save to: `apps/web/package.json`

- [ ] **Step 2: Create `apps/web/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "paths": {
      "@medlink/shared": ["../../packages/shared/src/index.ts"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

Save to: `apps/web/tsconfig.json`

- [ ] **Step 3: Create `apps/web/tsconfig.node.json`**

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts", "tailwind.config.ts"]
}
```

Save to: `apps/web/tsconfig.node.json`

- [ ] **Step 4: Create `apps/web/vite.config.ts`**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@medlink/shared': path.resolve(__dirname, '../../packages/shared/src/index.ts'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    coverage: {
      provider: 'v8',
      thresholds: { lines: 70 },
    },
  },
});
```

Save to: `apps/web/vite.config.ts`

- [ ] **Step 5: Create `apps/web/tailwind.config.ts`**

```typescript
import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        danger: {
          500: '#ef4444',
          600: '#dc2626',
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
```

Save to: `apps/web/tailwind.config.ts`

- [ ] **Step 6: Create `apps/web/postcss.config.js`**

```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

Save to: `apps/web/postcss.config.js`

- [ ] **Step 7: Create `apps/web/index.html`**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>MedLink — Healthcare Emergency Platform</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

Save to: `apps/web/index.html`

- [ ] **Step 8: Create `apps/web/src/index.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

Save to: `apps/web/src/index.css`

- [ ] **Step 9: Create `apps/web/src/App.tsx`**

```tsx
export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-blue-600">MedLink</h1>
        <p className="mt-2 text-gray-500">Healthcare Emergency Platform — Coming Soon</p>
      </div>
    </div>
  );
}
```

Save to: `apps/web/src/App.tsx`

- [ ] **Step 10: Create `apps/web/src/main.tsx`**

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

Save to: `apps/web/src/main.tsx`

- [ ] **Step 11: Create `apps/web/src/test-setup.ts`**

```typescript
import '@testing-library/jest-dom';
```

Save to: `apps/web/src/test-setup.ts`

- [ ] **Step 12: Write App component test**

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

Save to: `apps/web/src/App.test.tsx`

- [ ] **Step 13: Install web dependencies**

```bash
cd apps/web && pnpm install
```

Expected: All packages installed.

- [ ] **Step 14: Run web tests**

```bash
cd apps/web && pnpm test
```

Expected: `PASS src/App.test.tsx`

- [ ] **Step 15: Commit**

```bash
git add apps/web/
git commit -m "feat(web): bootstrap React+Vite app with Tailwind, TypeScript, Vitest"
```

---

## Task 6: Create `.env.example` and Docker Compose

**Files:**
- Create: `.env.example`
- Create: `docker-compose.yml`
- Create: `docker-compose.prod.yml`
- Create: `apps/api/Dockerfile`
- Create: `apps/web/Dockerfile`

- [ ] **Step 1: Create `.env.example`**

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

# JWT
JWT_SECRET=change_me_to_a_long_random_secret_at_least_64_chars
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY_DAYS=7

# Google Maps (frontend)
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

Save to: `.env.example`

- [ ] **Step 2: Create `docker-compose.yml`**

```yaml
version: '3.9'

services:
  postgres:
    image: postgres:16-alpine
    container_name: medlink_postgres
    restart: unless-stopped
    ports:
      - '5432:5432'
    environment:
      POSTGRES_DB: ${DATABASE_NAME:-medlink}
      POSTGRES_USER: ${DATABASE_USER:-medlink_user}
      POSTGRES_PASSWORD: ${DATABASE_PASSWORD:-medlink_pass}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U ${DATABASE_USER:-medlink_user} -d ${DATABASE_NAME:-medlink}']
      interval: 10s
      timeout: 5s
      retries: 5

  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    container_name: medlink_api
    restart: unless-stopped
    ports:
      - '3000:3000'
    env_file: .env
    environment:
      DATABASE_HOST: postgres
    depends_on:
      postgres:
        condition: service_healthy

  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    container_name: medlink_web
    restart: unless-stopped
    ports:
      - '5173:80'
    depends_on:
      - api

volumes:
  postgres_data:
```

Save to: `docker-compose.yml`

- [ ] **Step 3: Create `apps/api/Dockerfile`**

```dockerfile
FROM node:20-alpine AS base
RUN npm install -g pnpm@9
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/
RUN pnpm install --frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api
COPY turbo.json ./
RUN pnpm --filter @medlink/api build

FROM node:20-alpine AS runner
RUN npm install -g pnpm@9
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3000
CMD ["node", "dist/main"]
```

Save to: `apps/api/Dockerfile`

- [ ] **Step 4: Create `apps/web/Dockerfile`**

```dockerfile
FROM node:20-alpine AS base
RUN npm install -g pnpm@9
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/web/package.json ./apps/web/
RUN pnpm install --frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY packages/shared ./packages/shared
COPY apps/web ./apps/web
COPY turbo.json ./
ARG VITE_GOOGLE_MAPS_API_KEY
ENV VITE_GOOGLE_MAPS_API_KEY=$VITE_GOOGLE_MAPS_API_KEY
RUN pnpm --filter @medlink/web build

FROM nginx:alpine AS runner
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Save to: `apps/web/Dockerfile`

- [ ] **Step 5: Create `apps/web/nginx.conf`**

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://api:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Save to: `apps/web/nginx.conf`

- [ ] **Step 6: Commit**

```bash
git add .env.example docker-compose.yml docker-compose.prod.yml apps/api/Dockerfile apps/web/Dockerfile apps/web/nginx.conf
git commit -m "chore: add Docker Compose, Dockerfiles, env template"
```

---

## Task 7: GitHub Actions CI/CD

**Files:**
- Create: `.github/workflows/ci.yml`
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: Create `.github/workflows/ci.yml`**

```yaml
name: CI

on:
  push:
    branches: ['**']
  pull_request:
    branches: [main]

jobs:
  ci:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_DB: medlink_test
          POSTGRES_USER: medlink_user
          POSTGRES_PASSWORD: medlink_pass
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Lint
        run: pnpm turbo lint

      - name: Typecheck
        run: pnpm turbo typecheck

      - name: Test
        run: pnpm turbo test
        env:
          DATABASE_HOST: localhost
          DATABASE_PORT: 5432
          DATABASE_NAME: medlink_test
          DATABASE_USER: medlink_user
          DATABASE_PASSWORD: medlink_pass
          JWT_SECRET: test_secret_for_ci_only_not_production
          NODE_ENV: test

      - name: Build
        run: pnpm turbo build
```

Save to: `.github/workflows/ci.yml`

- [ ] **Step 2: Create `.github/workflows/deploy.yml`**

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    needs: []

    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build
        run: pnpm turbo build

      - name: Deploy API to Railway
        uses: bervProject/railway-deploy@main
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
          service: medlink-api

      - name: Deploy Web to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: apps/web
          vercel-args: '--prod'
```

Save to: `.github/workflows/deploy.yml`

- [ ] **Step 3: Commit**

```bash
git add .github/
git commit -m "ci: add GitHub Actions CI pipeline and deploy workflow"
```

---

## Task 8: Verify full monorepo works end-to-end

- [ ] **Step 1: Install all workspace dependencies from root**

```bash
pnpm install
```

Expected: All packages resolved, no errors.

- [ ] **Step 2: Run typecheck across all packages**

```bash
pnpm turbo typecheck
```

Expected: All packages pass type check.

- [ ] **Step 3: Run all tests**

```bash
pnpm turbo test
```

Expected: All tests pass. Coverage reported for api and web.

- [ ] **Step 4: Run lint**

```bash
pnpm turbo lint
```

Expected: No lint errors.

- [ ] **Step 5: Start API locally (requires local PostgreSQL or Docker)**

```bash
# Start postgres only
docker-compose up postgres -d

# Copy env and start API
cp .env.example .env
# Edit .env — set DATABASE_HOST=localhost

cd apps/api && pnpm dev
```

Expected: `MedLink API running on http://localhost:3000`, Swagger at `http://localhost:3000/api/docs`, `GET /api/v1/health` returns `{ "status": "ok" }`.

- [ ] **Step 6: Start web locally**

```bash
cd apps/web && pnpm dev
```

Expected: Vite dev server at `http://localhost:5173`, shows "MedLink — Healthcare Emergency Platform — Coming Soon".

- [ ] **Step 7: Final commit**

```bash
git add .
git commit -m "chore: verify monorepo foundation end-to-end — all tests pass, apps start"
```

---

## Self-Review

**Spec coverage check:**
- ✅ Turborepo monorepo structure — Task 1, 2
- ✅ `packages/shared` with enums, types, constants — Task 3
- ✅ NestJS app bootstrap with Swagger, Helmet, ValidationPipe, CORS — Task 4
- ✅ React + Vite + Tailwind bootstrap — Task 5
- ✅ Docker Compose (postgres + api + web) — Task 6
- ✅ GitHub Actions CI (lint, typecheck, test, build with postgres service) — Task 7
- ✅ GitHub Actions CD (deploy to Railway + Vercel) — Task 7
- ✅ `.env.example` — Task 6

**Placeholder scan:** None found. All steps have concrete code.

**Type consistency:** `@medlink/shared` path alias used consistently in both `tsconfig.json` files and `vite.config.ts`. `THROTTLE_TTL_SECONDS` and `THROTTLE_LIMIT` imported from shared in `app.module.ts`. `SOCKET_EVENTS` and `SOCKET_ROOMS` defined in shared constants for use in Plan 3.
