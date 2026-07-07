# Plan 5: What We Built — The Complete Learning Guide

**Project:** MedLink Healthcare Emergency Platform
**Plan 5 goal:** Make the project real — seed the database with realistic Indian data, add production-ready features (forgot password, pagination, file uploads), and deploy the app to the internet.

This document explains everything in plain language. No prior knowledge is assumed. If you have never deployed an app before, by the end of this guide you will understand exactly what is happening when a user opens the MedLink demo URL in their browser.

---

## Table of Contents

1. [The Big Picture — What Plan 5 Does](#1-the-big-picture)
2. [Why Seed Data Matters](#2-why-seed-data-matters)
3. [The Seed Script — Line by Line](#3-the-seed-script-line-by-line)
4. [Real Indian Data — Why It Matters for a Portfolio](#4-real-indian-data)
5. [ts-node Explained](#5-ts-node-explained)
6. [tsconfig-paths Explained](#6-tsconfig-paths-explained)
7. [The Forgot Password Flow](#7-the-forgot-password-flow)
8. [Pagination Explained](#8-pagination-explained)
9. [File Uploads Explained](#9-file-uploads-explained)
10. [Railway Explained](#10-railway-explained)
11. [Netlify Explained](#11-netlify-explained)
12. [What Happens When You Push to GitHub](#12-what-happens-when-you-push-to-github)
13. [The README Explained](#13-the-readme-explained)
14. [The DEPLOYMENT.md Explained](#14-the-deploymentmd-explained)
15. [How Deployment Works End-to-End](#15-how-deployment-works-end-to-end)
16. [Environment Variables in Production](#16-environment-variables-in-production)
17. [The Complete File List](#17-the-complete-file-list)
18. [Demo Accounts](#18-demo-accounts)

---

## 1. The Big Picture

By the end of Plan 4, MedLink had:
- A fully working NestJS API with 47 endpoints
- A React frontend with 26 pages
- Real-time WebSocket communication
- JWT authentication with role-based access control
- A PostgreSQL database with 11 entities

But there was a problem: **the database was empty**. If someone cloned the project and ran it, they would see login pages but have no accounts to log in with. There would be no hospitals to browse, no doctors to book, no donors to search. The app worked, but it was an empty shell.

Plan 5 solves three problems:

**Problem 1: No data.** The seed script creates realistic test data so the app is immediately usable.

**Problem 2: Missing features.** Before finishing, we added three features that any real production app needs: forgot password (so users can recover accounts), pagination (so the app doesn't load 10,000 hospitals at once), and file uploads (so users can attach profile photos and prescriptions).

**Problem 3: Not deployed.** The app was only running on a local laptop. Plan 5 adds the configuration to deploy to Railway (backend) and Netlify (frontend) so anyone in the world can use the URL.

---

## 2. Why Seed Data Matters

### What happens without seed data

Imagine you build a restaurant app. You have a beautiful menu page. But the database has zero menu items. When you open the menu page, it shows "No items found." A recruiter looking at your portfolio project opens the demo URL, sees an empty list, and moves on. The seed script prevents this.

### What is a seed script?

A seed script is a program that runs once (or repeatedly) to fill the database with starting data. It is not production data — real users will add real data over time. Seed data is just enough to make the app look alive for demos and testing.

Think of it like a movie set. Before filming, the set designers fill the shelves with fake books, put props on the tables, and hang pictures on the walls. The rooms are not real, but they look real on camera. Seed data is the same idea for an app.

### The idempotent upsert pattern

The word **idempotent** means "running it twice gives the same result as running it once." This is a critical property for seed scripts.

Here is why it matters: during development, you will run the seed script many times. Maybe you change some seed data and re-run it. Maybe you reset the database and need to re-populate it. If the seed script always tried to `INSERT` new rows, running it a second time would fail with "duplicate key" errors because the rows already exist.

The solution is an **upsert** pattern:
- Check if the record already exists
- If it exists: skip it (or update it)
- If it does not exist: create it

This way you can run the seed script 100 times and the database stays in a clean, predictable state.

In MedLink's seed script, the core of this pattern is the `upsertUser` function:

```typescript
async function upsertUser(data: Partial<UserEntity> & { email: string }): Promise<UserEntity> {
  const existing = await userRepo.findOne({ where: { email: data.email } });
  if (existing) return existing;
  return userRepo.save({ ...data, passwordHash: pw, isActive: true });
}
```

Step by step:
1. Look for a user with that email in the database
2. If found: return the existing user immediately (do not create a duplicate)
3. If not found: create the new user and return it

The same pattern is used for doctors, hospitals, donors, and drivers — each has a "find first, create only if missing" check.

---

## 3. The Seed Script — Line by Line

The seed script lives at `apps/api/src/database/seeds/seed.ts`. Let's walk through every section.

### The imports

```typescript
import 'dotenv/config';
import { AppDataSource } from '../data-source';
import * as bcrypt from 'bcryptjs';
import { UserEntity } from '../entities/user.entity';
// ... more entity imports
import {
  Role, BloodGroup, EmergencyType, EmergencyStatus,
  BloodRequestStatus, BloodRequestUrgency, BookingType, BookingStatus,
} from '@medlink/shared';
```

- `import 'dotenv/config'` — This loads the `.env` file automatically. Without this, environment variables like `DATABASE_HOST` would be undefined when the script runs.
- `AppDataSource` — This is TypeORM's connection to PostgreSQL. We need to connect before we can read or write anything.
- `bcrypt` — Used to hash the demo password so it is stored securely (never as plain text).
- The entity imports — These are the TypeORM classes that represent database tables.
- `@medlink/shared` — The enums live in the shared package. Notice the `@medlink/shared` import path — this is a path alias, explained in section 6.

### Connecting to the database

```typescript
async function seed() {
  await AppDataSource.initialize();
  console.log('✓ Connected to database');
```

`AppDataSource.initialize()` opens the connection to PostgreSQL. The `await` means the script pauses here until the connection is established. If the database is offline or the credentials are wrong, this line throws an error and the script stops immediately.

### Getting repositories

```typescript
const userRepo      = AppDataSource.getRepository(UserEntity);
const hospitalRepo  = AppDataSource.getRepository(HospitalEntity);
const donorRepo     = AppDataSource.getRepository(BloodDonorEntity);
// ... etc
```

In TypeORM, you don't write raw SQL. Instead, you get a **repository** for each entity (database table), and the repository gives you methods like `.findOne()`, `.save()`, `.find()`. Think of a repository as a helper class that talks to one specific table.

### Hashing the demo password

```typescript
const BCRYPT_ROUNDS = 10;
const pw = await bcrypt.hash('Test@12345', BCRYPT_ROUNDS);
```

We hash the password **once** at the top, then reuse the hash for every account. This is much more efficient than hashing it 20+ times inside the loop. The `10` in bcrypt means "run the hashing algorithm 2^10 = 1024 times," which makes it computationally expensive to crack by brute force.

This hash is used by every account: patients, hospital admins, donors, and drivers all share the same demo password `Test@12345`.

### Seeding patients

```typescript
const patients: UserEntity[] = [];
for (const p of [
  { name: 'Amit Sharma',  email: 'amit@medlink.demo',  phone: '+919876543210', role: Role.PATIENT },
  { name: 'Priya Patel',  email: 'priya@medlink.demo', phone: '+919876543211', role: Role.PATIENT },
  { name: 'Ravi Kumar',   email: 'ravi@medlink.demo',  phone: '+919876543212', role: Role.PATIENT },
]) patients.push(await upsertUser(p));
console.log(`✓ Seeded ${patients.length} patients`);
```

We keep the created user objects in the `patients` array because we need them later. When we seed bookings and emergency requests, we reference `patients[0].id` to link records to specific patients.

### Seeding hospitals — the two-step pattern

Hospitals are more complex than patients. A hospital has:
- A user account (the admin who logs in)
- A hospital record (the actual hospital entity with beds, location, etc.)

The seed script creates both, linked together:

```typescript
for (const h of hospitalSeedData) {
  // Step 1: Create the admin user account
  const admin = await upsertUser({ name: h.adminName, email: h.adminEmail, role: Role.HOSPITAL });

  // Step 2: Create the hospital record linked to that admin
  let hospital = await hospitalRepo.findOne({ where: { userId: admin.id } });
  if (!hospital) {
    hospital = await hospitalRepo.save({
      userId: admin.id,
      name: h.name,
      city: h.city,
      // ... all the other fields
    });
  }
  hospitals.push(hospital);
}
```

The `userId` field is what links the two records. When the hospital admin logs in, the system looks up their user ID and finds the associated hospital.

### Seeding doctors — using the hospitals array

```typescript
const doctorSeedData = [
  { hi: 0, name: 'Dr. Suresh Mehta', speciality: 'Cardiology', phone: '+919900001111' },
  { hi: 1, name: 'Dr. Kavitha Reddy', speciality: 'Oncology',  phone: '+919900002111' },
  // ...
];

for (const d of doctorSeedData) {
  let doc = await doctorRepo.findOne({ where: { name: d.name, hospitalId: hospitals[d.hi].id } });
  if (!doc) doc = await doctorRepo.save({ hospitalId: hospitals[d.hi].id, name: d.name, ... });
}
```

`hi` is short for "hospital index." `hi: 0` means "this doctor belongs to `hospitals[0]`" which is Apollo Mumbai. `hi: 1` means AIIMS Delhi. This is a compact way to assign doctors to specific hospitals without repeating the full hospital name every time.

The idempotent check for doctors looks for a match by both name AND hospitalId — just checking the name is not enough because two different hospitals could theoretically have a doctor with the same name.

### Seeding sample transactions

At the end, the script seeds a few emergency requests, blood requests, and bookings so the dashboard pages show real activity:

```typescript
const existingEmergency = await emergencyRepo.findOne({ where: { patientId: patients[0].id } });
if (!existingEmergency) {
  await emergencyRepo.save([
    {
      patientId: patients[0].id,
      hospitalId: hospitals[0].id,
      type: EmergencyType.ICU,
      status: EmergencyStatus.ACCEPTED,
      patientLat: 19.0760,
      patientLng: 72.8777,
      description: 'Chest pain, needs ICU immediately',
    },
    // ...
  ]);
}
```

Notice the check at the top: `if (!existingEmergency)`. For transactions, we check if any record exists for that patient, and only create records if none exist. This is simpler than checking each record individually.

### Closing the connection

```typescript
await AppDataSource.destroy();
console.log('\n✅ Seed complete!');
```

After all the data is created, we explicitly close the database connection. If we don't do this, the script would hang indefinitely (Node.js keeps running as long as there is an open connection). `AppDataSource.destroy()` closes the connection cleanly and lets the process exit.

---

## 4. Real Indian Data

### Why use real hospital names and cities?

Two reasons:

**Credibility.** "Apollo Hospital Mumbai" is a real, world-famous hospital chain. "Sahar Road, Andheri East" is the real address. When a recruiter sees this, they see that the developer thought carefully about the domain rather than just typing "Hospital 1", "Hospital 2". It signals attention to detail.

**GPS accuracy.** The app has a "find nearest hospitals" feature that uses geospatial queries. For this to work realistically, the coordinates need to be actual Indian cities:

| Hospital | City | Latitude | Longitude |
|---|---|---|---|
| Apollo Hospital Mumbai | Mumbai | 19.1136 | 72.8697 |
| AIIMS Delhi | Delhi | 28.5672 | 77.2100 |
| Manipal Hospital Bangalore | Bangalore | 12.9716 | 77.5946 |
| Fortis Malar Hospital Chennai | Chennai | 13.0827 | 80.2707 |
| Yashoda Hospitals Hyderabad | Hyderabad | 17.3850 | 78.4867 |

If a patient sends a GPS location from Mumbai (latitude ~19), the nearest hospital query will correctly return Apollo Mumbai rather than AIIMS Delhi (latitude ~28). The math works because the coordinates are real.

### Why Indian names for doctors and donors?

The app is designed as a demo for the Indian healthcare market. Using names like "Dr. Suresh Mehta," "Dr. Anjali Singh," and "Kiran Desai" makes it immediately clear what audience the platform targets. Indian recruiters and interviewers will appreciate the domain specificity.

The blood donors span different blood groups across different cities — this is intentional. When a patient in Mumbai needs O+ blood, the search will find Kiran Desai (O+, Mumbai) first. When a patient needs AB+ blood, it finds Sneha Pillai (AB+, Chennai). The data is designed to demonstrate the search functionality meaningfully.

---

## 5. ts-node Explained

### The problem

TypeScript is not directly executable by Node.js. Node.js understands JavaScript, not TypeScript. Normally, you must compile your TypeScript to JavaScript first (`tsc` compiles `.ts` files into `.js` files in the `dist/` folder), then run the compiled JavaScript.

For the API server, this is fine — you compile once and run the compiled output. But for a seed script, it is annoying. Every time you want to run it, you would need to:
1. Compile the entire project
2. Run the compiled script from the `dist/` folder

This is slow and error-prone.

### The solution: ts-node

`ts-node` is a tool that runs TypeScript directly, without a separate compilation step. Internally, it compiles the TypeScript in memory and passes the result to Node.js. From your perspective, you just run:

```bash
ts-node src/database/seeds/seed.ts
```

And it works as if Node.js could read TypeScript natively.

Look at the seed script command in `apps/api/package.json`:

```json
"seed": "ts-node -r tsconfig-paths/register -r dotenv/config src/database/seeds/seed.ts"
```

Breaking this down:
- `ts-node` — the TypeScript runner
- `-r tsconfig-paths/register` — registers path aliases before anything else runs (explained in section 6)
- `-r dotenv/config` — loads `.env` file before the script starts (equivalent to `import 'dotenv/config'` at the top)
- `src/database/seeds/seed.ts` — the script to run

### Why not use ts-node for the production server?

Performance. `ts-node` compiles TypeScript on the fly, which is slower than running pre-compiled JavaScript. In production, the Dockerfile compiles once (`pnpm build`) and then runs the compiled output with `node dist/main`. The compilation happens at deploy time, not at runtime.

---

## 6. tsconfig-paths Explained

### What are path aliases?

In a large TypeScript project, import paths can get ugly:

```typescript
// Without path aliases — navigating up many directories
import { Role } from '../../../packages/shared/src/index';
```

Path aliases let you define a short name for a path. In this project, `@medlink/shared` is an alias for the shared package. So you can write:

```typescript
// With path aliases — clean and readable
import { Role } from '@medlink/shared';
```

The alias `@medlink/shared` is defined in `tsconfig.json`:
```json
{
  "compilerOptions": {
    "paths": {
      "@medlink/shared": ["../../packages/shared/src/index.ts"]
    }
  }
}
```

### The problem at runtime

TypeScript aliases only exist at compile time. When you compile `import { Role } from '@medlink/shared'`, TypeScript resolves the alias and compiles it to the correct relative path. The compiled JavaScript knows where the file is.

But when you run TypeScript directly with `ts-node`, the alias needs to be resolved at runtime, not at compile time. `ts-node` by itself does not know about your path aliases — it just runs the TypeScript.

### The solution: tsconfig-paths

`tsconfig-paths/register` is a helper that reads your `tsconfig.json` at runtime and teaches Node.js how to resolve path aliases. When `ts-node` encounters `import { Role } from '@medlink/shared'`, the `tsconfig-paths` module intercepts the import and translates it to the actual file path.

That is why the seed command is:
```bash
ts-node -r tsconfig-paths/register src/database/seeds/seed.ts
```

The `-r tsconfig-paths/register` must come before the script path because `-r` means "require this module first, before anything else runs."

---

## 7. The Forgot Password Flow

### Why forgot password is not simple

At first glance, "forgot password" sounds trivial: user types email, you email them a new password. But real-world forgot password is a multi-step security problem. Let's walk through what MedLink does and why each step matters.

### The PasswordResetTokenEntity

A new database table was added: `password_reset_tokens`. Here is the entity:

```typescript
@Entity('password_reset_tokens')
export class PasswordResetTokenEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity;

  @Column({ type: 'varchar', length: 255, unique: true })
  token!: string;

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt!: Date;

  @Column({ name: 'is_used', default: false })
  isUsed!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
```

This table stores one row per password reset attempt. The important fields:

- `token` — a random 64-character hex string (32 random bytes, converted to hex). This token is unique — no two users can have the same token, and it cannot be guessed.
- `expiresAt` — set to 1 hour from when the request was made. After 1 hour, the token is invalid even if it was never used.
- `isUsed` — once a user resets their password with this token, the token is marked as used. It cannot be used again.
- `onDelete: 'CASCADE'` — if the user account is deleted, all their password reset tokens are automatically deleted too.

### Step 1: User submits their email

The user opens `ForgotPasswordPage.tsx`, types their email, and submits the form. The API receives the request at `POST /api/v1/auth/forgot-password`.

### Step 2: Email enumeration prevention

Here is a subtle security requirement. What should the API return if the email is not registered?

Option A (bad): Return "That email is not registered." This tells an attacker which emails exist in your system. They could submit thousands of emails and build a list of real users. This is called **email enumeration**.

Option B (correct, what MedLink does): Always return "If that email is registered, you'll receive a reset link shortly." The response is identical whether the email exists or not. The attacker learns nothing.

Look at the ForgotPasswordPage success message:
```tsx
<p>
  If that email is registered, you'll receive a password reset link shortly.
</p>
```

This exact phrasing is intentional. It is the standard wording used by GitHub, Google, and every security-conscious platform.

### Step 3: Token generation and storage

If the email does exist, the API:
1. Generates a random token: `crypto.randomBytes(32).toString('hex')` (64 hex chars)
2. Sets expiry to 1 hour from now: `new Date(Date.now() + 60 * 60 * 1000)`
3. Saves a `PasswordResetTokenEntity` row
4. In a real deployment: sends an email with a link like `https://yoursite.com/reset-password?token=abc123...`
5. In the demo: prints the link to the console (no email service configured)

The ForgotPasswordPage even shows this in a small note:
```tsx
<span className="text-xs text-surface-400">
  (For this demo, check the API server console for the reset link)
</span>
```

### Step 4: User opens the reset link

The reset link takes the user to `ResetPasswordPage.tsx`. The token is extracted from the URL query string. The user types a new password.

### Step 5: Token validation

The API receives `POST /api/v1/auth/reset-password` with the token and new password. It:
1. Looks up the token in the database
2. Checks: does it exist? (if not: invalid link)
3. Checks: `expiresAt > now`? (if not: link expired, ask user to request a new one)
4. Checks: `isUsed === false`? (if not: link already used)
5. If all checks pass: hash the new password, update the user, mark the token as `isUsed: true`, and invalidate all existing sessions (by rotating the refresh token)

### Why invalidate all sessions after a reset?

If someone's account was compromised and they reset their password, the attacker might still have a valid session (refresh token cookie). By invalidating all sessions on password reset, the attacker is forcibly logged out even if they are currently active.

---

## 8. Pagination Explained

### What is pagination and why does it matter?

Imagine the MedLink database grows to 1000 hospitals. Without pagination, a request to `GET /api/v1/hospitals` would load all 1000 rows from the database, serialize them all to JSON, and send a huge response. This is:
- **Slow** — loading 1000 database rows takes more time than loading 10
- **Memory-hungry** — the API and the browser both have to hold all 1000 objects in memory
- **Bad UX** — the frontend would render a list with 1000 items, which nobody would scroll through

Pagination splits the data into pages. A typical request loads page 1 with 10 items. When the user clicks "next," it loads page 2 with the next 10 items, and so on.

### The API response shape

Paginated endpoints in MedLink return this shape:

```json
{
  "success": true,
  "data": {
    "items": [...],
    "total": 47,
    "page": 2,
    "limit": 10,
    "totalPages": 5
  }
}
```

The four pagination fields:
- `total` — total number of records in the database matching the filters (e.g., 47 hospitals)
- `page` — which page you are currently on (e.g., 2)
- `limit` — how many items per page (e.g., 10)
- `totalPages` — total number of pages: `Math.ceil(total / limit)` (e.g., `Math.ceil(47/10) = 5`)

### The PaginatedResult interface

In `packages/shared/src/`, a `PaginatedResult<T>` interface was added:

```typescript
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
```

The `<T>` is a TypeScript **generic**. It means "I don't know what type the items are yet — the caller will tell me." `PaginatedResult<Hospital>` means an object with `items: Hospital[]`. `PaginatedResult<BloodDonor>` means `items: BloodDonor[]`. The same interface works for any entity.

### How the backend computes paginated results

A typical paginated service method looks like this:

```typescript
const [items, total] = await hospitalRepo.findAndCount({
  skip: (page - 1) * limit,   // SQL OFFSET
  take: limit,                  // SQL LIMIT
  order: { rating: 'DESC' },
});

return {
  items,
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit),
};
```

- `skip` is the SQL OFFSET — how many rows to skip before starting. For page 1: skip 0. For page 2: skip 10. For page 3: skip 20. Formula: `(page - 1) * limit`.
- `take` is the SQL LIMIT — how many rows to return.
- `findAndCount` returns both the data and the total count in a single database query, which is efficient.

### The Pagination UI Component

The frontend has a reusable `Pagination` component at `apps/web/src/components/ui/Pagination.tsx`:

```typescript
interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({ page, totalPages, onPageChange, className }: PaginationProps) {
  if (totalPages <= 1) return null;
  // ... renders Previous button, page numbers, Next button
}
```

Key behaviors:
- If there is only 1 page (or 0 pages), the component renders nothing (`return null`). No one wants to see a pagination bar with a single page.
- Shows at most 5 page numbers at a time, with `...` ellipsis for skipped ranges (e.g., `1 ... 4 5 6 ... 12`)
- Previous and Next buttons are disabled at the boundaries (no clicking Previous on page 1)
- The current page button is highlighted with the brand color

Any page that shows a list — hospitals, doctors, donors — passes its current `page` state and the `totalPages` from the API response to this component. When the user clicks a page button, `onPageChange` is called, which updates the `page` state, which triggers a new API request with `?page=X`.

---

## 9. File Uploads Explained

### What is multipart/form-data?

When a form submits a text field, the data is simple: `{"email": "user@example.com"}`. This is JSON — plain text.

Files are different. A file is binary data (bytes). You cannot put binary data in a JSON string. So when submitting a file, the browser uses a different content type called **multipart/form-data**. The request body is split into "parts" — each part has a name, optional filename, content type, and the raw bytes.

```
Content-Type: multipart/form-data; boundary=----abc123

------abc123
Content-Disposition: form-data; name="file"; filename="photo.jpg"
Content-Type: image/jpeg

<binary JPEG data here>
------abc123--
```

### What is Multer?

Multer is a Node.js library that parses multipart/form-data requests. It intercepts the incoming request, extracts the file data, and (depending on configuration) saves it to disk or holds it in memory. It then makes the file available to your controller as `req.file`.

Without Multer, you would have to write your own multipart parser — which is complex. Multer handles all of that.

### How MedLink configures Multer

The Multer configuration lives in `apps/api/src/uploads/uploads.module.ts`:

```typescript
MulterModule.register({
  storage: diskStorage({
    destination: join(process.cwd(), 'uploads'),
    filename: (_req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|pdf/;
    const ext = allowed.test(extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) cb(null, true);
    else cb(new Error('Only images (JPEG/PNG/GIF) and PDFs are allowed'), false);
  },
})
```

Breaking this down:

**diskStorage vs memoryStorage**
- `diskStorage` — saves files to the local filesystem (the `uploads/` folder on the server). The file persists after the request ends. Good for most use cases.
- `memoryStorage` — holds the file in RAM as a Buffer. Useful when you need to process the file (e.g., resize it) before saving. Not used here because we just want to store the file.

**The destination**
```typescript
destination: join(process.cwd(), 'uploads')
```
Files are saved in an `uploads/` folder in the project root. `process.cwd()` is the directory where the Node.js process is running. `join` is path.join from Node.js — it combines paths correctly for any operating system.

**The filename**
```typescript
const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
```
We cannot use the original filename because:
- Two users might upload `photo.jpg` — they would overwrite each other
- Filenames might contain spaces or special characters that break URLs
- Exposing original filenames can leak information

Instead, we generate a unique filename like `1720345678901-482938471.jpg`. `Date.now()` gives milliseconds since 1970 (guaranteed to change every millisecond), and the random number adds extra uniqueness.

**The size limit**
```typescript
limits: { fileSize: 5 * 1024 * 1024 }
```
`5 * 1024 * 1024 = 5,242,880 bytes = 5 MB`. Files larger than 5MB are rejected automatically. This prevents users from uploading huge files that would fill up the server's disk.

**The file filter**
The fileFilter checks both the file extension AND the MIME type. Why both?
- Extension check: a file named `malware.exe` would fail because `.exe` is not in the allowed list
- MIME type check: a file renamed from `virus.php` to `photo.jpg` would still have a PHP MIME type and would fail

Checking both provides defense in depth.

### The UploadsController

```typescript
@Post('avatar')
@UseGuards(JwtAuthGuard)
@UseInterceptors(FileInterceptor('file'))
uploadAvatar(@UploadedFile() file: Express.Multer.File) {
  if (!file) throw new BadRequestException('No file provided');
  return { url: `/api/v1/uploads/files/${file.filename}`, filename: file.filename };
}
```

- `@UseGuards(JwtAuthGuard)` — only logged-in users can upload files
- `@UseInterceptors(FileInterceptor('file'))` — tells Multer to process this request and look for a field named `"file"` in the multipart form
- `@UploadedFile()` — injects the processed file object (already saved to disk by Multer)
- The response returns a URL that the frontend can use to display the uploaded file

There is also a `@Get('files/:filename')` endpoint that serves saved files back to the browser.

### The AvatarUpload Component

The frontend component at `apps/web/src/components/ui/AvatarUpload.tsx` handles the upload with an instant preview:

```typescript
async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
  const file = e.target.files?.[0];
  if (!file) return;

  // Step 1: Show the image immediately (before upload finishes)
  const reader = new FileReader();
  reader.onload = (ev) => setPreview(ev.target?.result as string);
  reader.readAsDataURL(file);

  // Step 2: Upload the file to the API in the background
  setUploading(true);
  try {
    const result = await uploadService.uploadAvatar(file);
    onUpload(result.url);  // Notify the parent component of the new URL
  } catch {
    setPreview(currentUrl ?? null);  // Revert preview on error
  } finally {
    setUploading(false);
  }
}
```

The `FileReader` API is a browser built-in that reads a local file as a data URL (a base64-encoded string that can be put directly in an `<img src>` tag). This is what enables the instant preview — the image appears in the UI the moment the user selects it, before the upload even starts. If the upload fails, the preview reverts to the previous photo.

---

## 10. Railway Explained

### What is Railway?

Railway is a cloud hosting platform for backend applications. You give it your code, it builds and runs it, and gives you a public URL. Railway also provides managed databases — you can add a PostgreSQL instance with one click and it manages backups, updates, and connection pooling for you.

Railway is designed to be developer-friendly. It reads a configuration file (`railway.json`) from your repository and knows exactly how to build and run your app.

### The railway.json file

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "apps/api/Dockerfile"
  },
  "deploy": {
    "startCommand": "node dist/main",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 30,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  }
}
```

Breaking this down:

**build.builder = "DOCKERFILE"**
Railway supports multiple build methods. "DOCKERFILE" means "read my Dockerfile and build using that." The alternative would be Nixpacks (Railway's automatic build detection), but we want precise control.

**build.dockerfilePath**
Points to `apps/api/Dockerfile` — the Dockerfile for the NestJS backend. In a monorepo, we need to specify which package's Dockerfile to use.

**deploy.startCommand = "node dist/main"**
After the Docker image is built, Railway runs this command to start the app. The Dockerfile compiles TypeScript to JavaScript in `dist/`, so `node dist/main` runs the compiled NestJS server.

**deploy.healthcheckPath = "/health"**
Railway periodically hits this URL to check if the app is alive. MedLink has a `/health` endpoint that returns `{"status":"ok"}`. If Railway hits this and gets an error for too long, it considers the app crashed and restarts it.

**deploy.restartPolicyType = "ON_FAILURE"**
If the Node.js process crashes (unhandled error, out of memory, etc.), Railway automatically restarts it. `maxRetries: 3` means it tries 3 times before giving up and notifying you.

### What the Dockerfile does

The Dockerfile uses a **multi-stage build** pattern. This is a best practice for production Docker images:

```dockerfile
# Stage 1: base — common setup (Node 20, pnpm)
FROM node:20-alpine AS base
RUN npm install -g pnpm@9
WORKDIR /app

# Stage 2: deps — install dependencies only
FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/
RUN pnpm install --frozen-lockfile

# Stage 3: builder — compile TypeScript
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api
COPY turbo.json ./
RUN pnpm --filter @medlink/api build

# Stage 4: runner — the final, slim production image
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

Why multi-stage? Each stage starts fresh. The final `runner` stage only contains:
- The compiled JavaScript (`dist/`)
- The production dependencies (`node_modules/`)

It does NOT contain:
- TypeScript source files
- Development dependencies (jest, ts-node, eslint, etc.)
- Build tools

This makes the final Docker image much smaller, which means faster deploys and less attack surface.

---

## 11. Netlify Explained

### What is Netlify?

Netlify is a hosting platform for static websites and frontend apps. A React app, once built, is just a folder of HTML, CSS, and JavaScript files — "static files." Netlify serves these files from its global CDN (Content Delivery Network), which means the files are stored on servers all over the world. When a user in Tokyo opens your site, they get the files from a nearby server in Tokyo, not from a server in the US. This makes the site load fast everywhere.

Netlify is free for personal projects and provides automatic deployments on every git push.

### The netlify.toml file

```toml
[build]
  base    = "apps/web"
  command = "pnpm build"
  publish = "apps/web/dist"

[build.environment]
  NODE_VERSION = "20"
  PNPM_VERSION = "9"

[[redirects]]
  from   = "/api/*"
  to     = "https://YOUR_RAILWAY_URL/api/:splat"
  status = 200
  force  = true

[[redirects]]
  from   = "/*"
  to     = "/index.html"
  status = 200
```

Breaking this down:

**build.base = "apps/web"**
In a monorepo, the frontend code is in `apps/web/`, not the repository root. This tells Netlify to look for the build configuration in that subdirectory.

**build.command = "pnpm build"**
The command Netlify runs to build the app. For Vite + React, `pnpm build` compiles all the TypeScript and JSX into plain JavaScript and creates the `dist/` folder.

**build.publish = "apps/web/dist"**
The folder to deploy. After `pnpm build` runs, the output is in `apps/web/dist/`. Netlify takes everything in this folder and deploys it.

**The API proxy redirect**
```toml
[[redirects]]
  from   = "/api/*"
  to     = "https://YOUR_RAILWAY_URL/api/:splat"
  status = 200
  force  = true
```

This is a server-side proxy. When the React app makes a request to `/api/v1/hospitals`, Netlify intercepts it and forwards it to the Railway API. The `:splat` placeholder means "the rest of the URL after /api/" — so `/api/v1/hospitals` becomes `https://YOUR_RAILWAY_URL/api/v1/hospitals`.

Why is this needed? CORS (Cross-Origin Resource Sharing). Browsers block requests from one domain to another by default. If the frontend at `medlink.netlify.app` tries to directly call `medlink-api.railway.app`, the browser blocks it unless the API explicitly allows it. The proxy makes both the frontend and API appear to be on the same domain from the browser's perspective, eliminating CORS issues entirely.

**The SPA redirect rule**
```toml
[[redirects]]
  from   = "/*"
  to     = "/index.html"
  status = 200
```

This is one of the most important rules for React apps, and beginners often miss it.

Here is the problem: React uses **client-side routing**. When you navigate to `/patient/hospitals` in a React app, React Router handles the URL change entirely in JavaScript — it updates the browser's address bar and renders the right component. No request is made to the server.

But what if someone bookmarks `https://medlink.netlify.app/patient/hospitals` and opens it in a new tab? The browser makes a direct request to Netlify for the path `/patient/hospitals`. Netlify looks in the `dist/` folder for a file at that path. There is no such file — the only file is `index.html`. Without this redirect rule, Netlify would return a 404.

The redirect rule says: for any URL (`/*`), serve `index.html`. Once `index.html` loads, React and React Router take over and render the correct page.

---

## 12. What Happens When You Push to GitHub

### GitHub Actions CI/CD

Every time you push code to GitHub, a process called CI/CD (Continuous Integration / Continuous Deployment) runs automatically. It is defined in `.github/workflows/ci.yml`.

CI means "every time code changes, automatically check that it is correct." CD means "automatically deploy it." MedLink has CI. Railway and Netlify handle CD (they deploy automatically when CI passes and code is on the `main` branch).

### The workflow file explained

```yaml
name: CI

on:
  push:
    branches: ['**']
  pull_request:
    branches: [main]
```

This CI pipeline runs on every push to any branch, and on every pull request targeting `main`.

```yaml
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
```

GitHub Actions can spin up Docker containers as services. Here, a real PostgreSQL 16 database is started for the test run. The API tests run against this real database (not a mock), which makes the tests much more reliable. The `health-cmd pg_isready` means GitHub waits until PostgreSQL is actually ready before running tests.

### The four jobs

**1. Install dependencies**
```yaml
- name: Install dependencies
  run: pnpm install --frozen-lockfile
```
`--frozen-lockfile` means "do not update pnpm-lock.yaml, fail if the lock file is out of date." This ensures everyone uses exactly the same package versions.

**2. Lint**
```yaml
- name: Lint
  run: pnpm turbo lint
```
ESLint checks the code for style errors, potential bugs, and bad practices. If you use `any` type too liberally or forget to handle a Promise, ESLint will catch it. Lint failures block the build.

**3. Typecheck**
```yaml
- name: Typecheck
  run: pnpm turbo typecheck
```
TypeScript's type checker (`tsc --noEmit`) validates all type annotations across the entire codebase. `--noEmit` means "check types but do not produce output files." This catches type errors that ESLint might miss.

**4. Test**
```yaml
- name: Test
  run: pnpm turbo test
  env:
    DATABASE_HOST: localhost
    DATABASE_PORT: 5432
    DATABASE_NAME: medlink_test
    JWT_SECRET: test_secret_for_ci_only_not_production
    NODE_ENV: test
```
Runs Jest (API tests) and Vitest (frontend tests). Note the environment variables — the tests connect to the real PostgreSQL service container. `JWT_SECRET` is set to a dummy value for testing; it is never the production secret.

**5. Build**
```yaml
- name: Build
  run: pnpm turbo build
```
Compiles both the API and the frontend to production builds. This catches any errors that might slip through type checking (e.g., a Vite config issue that TypeScript does not see).

### Why automated testing matters

Without CI, the workflow is:
1. Developer makes change
2. Developer manually tests on their laptop
3. Developer pushes to GitHub
4. Change is deployed
5. Sometimes, the change breaks something the developer did not test

With CI:
1. Developer makes change
2. Developer pushes to GitHub
3. GitHub runs all 34 API tests and the frontend build automatically
4. If anything fails, the developer is notified immediately — before deployment
5. Only if everything passes does the change reach production

This is how professional teams work. The CI pipeline is a safety net that catches regressions — bugs that were not present before a change, but were introduced by it.

---

## 13. The README Explained

### Why a good README matters for portfolio

A README is the first thing anyone sees when they visit your GitHub repository. It is your cover letter and technical resume combined. A project with a professional README signals:
- You understand how to communicate technical work
- You have thought through the architecture
- Someone can actually use and understand your project

The MedLink README at the repository root is a complete, production-quality document. Let's look at each section.

### The badges

```markdown
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![NestJS](https://img.shields.io/badge/NestJS-10-E0234E?logo=nestjs&logoColor=white)](https://nestjs.com)
```

Badges are small images that show the technologies used. They come from `shields.io`, a free service that generates them. The URL format is:
```
https://img.shields.io/badge/<label>-<message>-<color>?logo=<logo-name>
```

Badges serve two purposes: they look professional, and they let a reader immediately scan the tech stack without reading a word of text.

### The architecture diagram

```
Browser → Netlify (React SPA)
              ↓ REST + WebSocket
         Railway (NestJS API)
              ↓ TypeORM
         Railway (PostgreSQL 16)
```

This ASCII diagram shows the three-tier architecture at a glance. A recruiter can understand the deployment architecture in 5 seconds. It shows you understand the full stack from browser to database.

### The tech stack table

| Layer | Technologies |
|-------|-------------|
| Frontend | React 18, Vite, TypeScript, ... |
| Backend | NestJS 10, TypeScript, TypeORM, ... |
| DevOps | Docker, GitHub Actions, Turborepo, pnpm |
| Deployment | Netlify, Railway |

This table shows technical breadth. Many junior developers only know one layer. Seeing all four layers covered signals a full-stack engineer who understands the complete system.

### The quick start section

The README shows exactly how to get the project running locally in 7 steps. This is important because:
- Recruiters who want to run the code locally can follow the steps
- A hiring manager who asks "can you walk me through setting up this project?" wants a clear answer
- It demonstrates you understand the dev workflow from scratch

### The API documentation table

Listing 47 endpoints with their HTTP methods, paths, and descriptions demonstrates scope. It says "this is not a toy project with 3 endpoints — this is a real API."

### The WebSocket events table

| Event | Direction | Description |
|-------|-----------|-------------|
| emergency:new | Server → Hospital | New SOS arrived |
| ambulance:location_update | Driver → Server → Patient | Live GPS |

Showing the WebSocket events and their directions (who sends, who receives) demonstrates understanding of event-driven real-time architecture.

---

## 14. The DEPLOYMENT.md Explained

### Why a deployment guide matters

A project that cannot be deployed is a project that only you can use. The DEPLOYMENT.md (`docs/DEPLOYMENT.md`) is a step-by-step guide for deploying to Railway and Netlify. It matters for two reasons:

1. **Portfolio credibility**: It shows you know how to deploy, not just code
2. **Practical use**: When you actually deploy this project for your portfolio, you have a checklist to follow

The guide covers 5 major steps:
1. Cloning the repository
2. Deploying PostgreSQL and the API on Railway
3. Deploying the frontend on Netlify
4. Connecting the two services (updating FRONTEND_URL)
5. Verifying everything works

### The environment variable setup section

The deployment guide lists every environment variable needed for the API:

```
DATABASE_URL         = <from Railway PostgreSQL>
NODE_ENV             = production
PORT                 = 3000
JWT_SECRET           = <64-char random hex string>
JWT_ACCESS_EXPIRY    = 15m
JWT_REFRESH_EXPIRY_DAYS = 7
FRONTEND_URL         = https://YOUR_NETLIFY_URL
```

And how to generate the JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

This command generates 64 random bytes and converts them to a 128-character hex string. This secret is used to sign JWTs — it must be random, long, and never committed to git.

### The seeding section

The guide covers how to seed the Railway database after deploy:
```bash
DATABASE_URL="postgresql://..." pnpm seed
```

Setting `DATABASE_URL` as a prefix to the command temporarily overrides the environment variable just for that command, without affecting other processes or your `.env` file.

### The troubleshooting section

The deployment guide includes a troubleshooting section covering the most common failure modes:
- API not starting: check Railway build logs, verify env vars
- Frontend shows blank page: check browser console for CORS errors, verify `FRONTEND_URL`
- Seed fails: check DATABASE_URL format

Good troubleshooting documentation shows experience — you have actually deployed this and encountered these problems.

---

## 15. How Deployment Works End-to-End

Let's trace exactly what happens from the moment you push code to the moment a user opens the app in their browser.

### The deploy flow

```
Developer's laptop
│
├─── git push origin main
│
└─── GitHub receives the push
     │
     ├─── GitHub Actions CI pipeline starts
     │    ├─── Install dependencies
     │    ├─── Lint (ESLint)
     │    ├─── Typecheck (tsc)
     │    ├─── Test (Jest with real PostgreSQL)
     │    └─── Build (verify compilation)
     │
     ├─── Railway detects new commit on main
     │    ├─── Reads railway.json
     │    ├─── Builds Docker image from apps/api/Dockerfile
     │    │    ├─── Stage 1: Install Node 20, pnpm
     │    │    ├─── Stage 2: Install all npm dependencies
     │    │    ├─── Stage 3: Compile TypeScript → dist/
     │    │    └─── Stage 4: Create slim production image
     │    ├─── Runs new image: node dist/main
     │    ├─── Injects env vars (DATABASE_URL, JWT_SECRET, etc.)
     │    └─── Hits /health — confirms app is alive
     │
     └─── Netlify detects new commit on main
          ├─── Reads netlify.toml
          ├─── Runs: pnpm build in apps/web/
          ├─── Compiles React + TypeScript → static files in dist/
          └─── Deploys static files to global CDN
```

### What happens when a user opens the URL

```
User opens https://medlink.netlify.app
│
├─── Browser requests index.html from Netlify CDN
├─── Netlify returns index.html (near-instant, served from nearby CDN node)
├─── index.html loads React bundle (JavaScript)
├─── React boots, reads current URL
├─── React Router renders the landing page component
│
User clicks "Login"
│
├─── React renders LoginPage
├─── User submits form with email + password
├─── React calls POST /api/v1/auth/login
├─── Netlify proxy intercepts "/api/*" request
├─── Netlify forwards to https://medlink-api.railway.app/api/v1/auth/login
├─── Railway routes to NestJS
├─── NestJS validates credentials, returns JWT + sets cookie
├─── React receives token, stores in Zustand, redirects to dashboard
│
User is now on /patient/hospitals
│
├─── React calls GET /api/v1/hospitals?page=1&limit=10
├─── Netlify proxy forwards to Railway
├─── NestJS queries PostgreSQL: SELECT ... LIMIT 10 OFFSET 0
├─── Returns { items: [...], total: 5, page: 1, totalPages: 1 }
└─── React renders hospital cards
```

The entire experience is seamless — the user never sees Railway or knows the frontend and backend are on different domains.

---

## 16. Environment Variables in Production

### Why .env is never committed to git

The `.env` file contains secrets:
- `JWT_SECRET` — if someone knows this, they can forge authentication tokens and log in as any user
- `DATABASE_PASSWORD` — if exposed, anyone could delete your entire database
- `DATABASE_URL` — contains the hostname, username, and password for the database

If you commit `.env` to git and push to a public GitHub repository, anyone can read it. This has happened to real companies and resulted in data breaches. The `.gitignore` file includes `.env` specifically to prevent this.

### How Railway injects environment variables

Railway has a "Variables" tab for each service. You manually enter the key-value pairs there. When Railway runs your Docker container, it injects these as environment variables at runtime — the process reads them with `process.env.JWT_SECRET`, etc.

The Docker image itself does not contain any secrets. The same Docker image could be run in a development environment with different variables. This separation of code and configuration is a fundamental best practice called the **12-factor app** methodology.

### Key environment variables explained

| Variable | Where set | What it does |
|---|---|---|
| `DATABASE_URL` | Railway | Full connection string for PostgreSQL. Format: `postgresql://user:password@host:port/dbname` |
| `NODE_ENV` | Railway | Set to `production`. NestJS and many libraries behave differently in production vs development |
| `PORT` | Railway | Which port the app listens on. Railway sets this automatically, or you can override it |
| `JWT_SECRET` | Railway | The secret key for signing and verifying JWT tokens. Must be at least 64 random characters |
| `JWT_ACCESS_EXPIRY` | Railway | How long an access token lasts. `15m` = 15 minutes |
| `JWT_REFRESH_EXPIRY_DAYS` | Railway | How long a refresh token lasts. `7` = 7 days |
| `FRONTEND_URL` | Railway | Your Netlify URL. Used by NestJS for CORS — only this URL is allowed to make API requests |
| `VITE_API_URL` | Netlify | The Railway URL. Used by the React app to know where the API is |

### Why JWT_SECRET must be different in production

In development, you might use a simple JWT_SECRET like `dev_secret`. If this value was ever exposed (e.g., accidentally logged), it only affects your local development environment.

In production, the JWT_SECRET is what protects all real user sessions. If it is guessed or leaked:
- An attacker can generate a valid JWT for any user ID
- They can log in as any user without knowing the password
- They can access any patient's medical data

A 128-character random hex string has `2^512` possible values. It cannot be guessed. This is why the deployment guide uses:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Why DATABASE_URL uses the full connection string format

In local development, we use separate `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_NAME`, etc. variables. This is fine when you control the infrastructure.

Railway PostgreSQL provides a single `DATABASE_URL` variable in the format:
```
postgresql://postgres:PASSWORD@containers-us-west-xxx.railway.app:6543/railway
```

The `AppDataSource` in `apps/api/src/database/data-source.ts` supports both patterns:
```typescript
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  // ...
});
```

When `DATABASE_URL` is provided (Railway environment), TypeORM reads it and ignores the individual variables. When running locally, the individual variables from `.env` are used.

---

## 17. The Complete File List

Every file created or modified in Plan 5:

### New files

| File | What it is |
|---|---|
| `apps/api/src/database/seeds/seed.ts` | The seed script — creates all demo data |
| `apps/api/src/database/entities/password-reset-token.entity.ts` | TypeORM entity for password reset tokens |
| `apps/web/src/pages/auth/ForgotPasswordPage.tsx` | Frontend page: enter email to request reset |
| `apps/web/src/pages/auth/ResetPasswordPage.tsx` | Frontend page: enter new password with token |
| `apps/web/src/components/ui/Pagination.tsx` | Reusable pagination UI component |
| `apps/web/src/components/ui/AvatarUpload.tsx` | Profile photo upload with instant preview |
| `apps/api/src/uploads/uploads.module.ts` | NestJS module configuring Multer |
| `apps/api/src/uploads/uploads.controller.ts` | Upload endpoints (avatar + prescription) |
| `railway.json` | Railway deployment configuration |
| `netlify.toml` | Netlify build and redirect configuration |
| `README.md` | Project README with full documentation |
| `docs/DEPLOYMENT.md` | Step-by-step deployment guide |

### Modified files

| File | What changed |
|---|---|
| `apps/api/src/app.module.ts` | Added UploadsModule to AppModule |
| `apps/api/src/auth/auth.service.ts` | Added forgotPassword and resetPassword methods |
| `apps/api/src/auth/auth.controller.ts` | Added forgot-password and reset-password endpoints |
| `apps/api/src/hospitals/hospitals.service.ts` | Updated to return paginated results |
| `apps/api/src/hospitals/hospitals.controller.ts` | Added page/limit query params |
| `apps/api/src/blood/blood.service.ts` | Updated donor search to return paginated results |
| `apps/api/package.json` | Added `seed` script, `ts-node` and `tsconfig-paths` dev deps |
| `packages/shared/src/index.ts` | Added PaginatedResult interface |
| `apps/web/src/router/index.tsx` | Added routes for ForgotPassword and ResetPassword |
| `apps/web/src/services/auth.service.ts` | Added forgotPassword and resetPassword API calls |
| `apps/web/src/services/upload.service.ts` | Added uploadAvatar API call |

---

## 18. Demo Accounts

After running `pnpm seed`, these accounts are available. All use the same password: **`Test@12345`**

| Role | Email | What this user can do |
|---|---|---|
| Patient | `amit@medlink.demo` | Send SOS emergency requests with GPS, find nearby hospitals, book doctor appointments, create blood requests, track ambulance location in real-time |
| Hospital Admin | `apollo_hospital@medlink.demo` | View and manage ICU bed availability, accept/reject incoming emergencies, view booked appointments, dispatch ambulances, see all doctors |
| Blood Donor | `kiran@medlink.demo` | Toggle donation availability, view incoming blood requests matching O+ blood type, mark donations as fulfilled, see donation history |
| Ambulance Driver | `driver1@medlink.demo` | Go on/off duty, send live GPS location updates every 5 seconds, accept emergency dispatch from hospital |

### Additional patient accounts

| Name | Email |
|---|---|
| Priya Patel | `priya@medlink.demo` |
| Ravi Kumar | `ravi@medlink.demo` |

### Additional hospital admin accounts

| Hospital | Email |
|---|---|
| AIIMS Delhi | `aiims_delhi@medlink.demo` |
| Manipal Hospital Bangalore | `manipal_hospital@medlink.demo` |
| Fortis Malar Chennai | `fortis_malar@medlink.demo` |
| Yashoda Hospitals Hyderabad | `yashoda@medlink.demo` |

### Additional blood donor accounts

| Name | Blood Group | City | Email |
|---|---|---|---|
| Neha Joshi | A+ | Delhi | `neha@medlink.demo` |
| Rahul Verma | B+ | Bangalore | `rahul@medlink.demo` |
| Sneha Pillai | AB+ | Chennai | `sneha@medlink.demo` |
| Mohan Das | O- | Hyderabad | `mohan@medlink.demo` |
| Lakshmi Nair | A- | Mumbai | `lakshmi@medlink.demo` |

### Additional ambulance driver accounts

| Driver | Vehicle | Hospital | Email |
|---|---|---|---|
| Sunil Yadav | DL01CD5678 | AIIMS Delhi | `driver2@medlink.demo` |
| Deepak Mishra | KA01EF9012 | Manipal Bangalore | `driver3@medlink.demo` |
| Arun Singh | TN01GH3456 | Fortis Malar Chennai | `driver4@medlink.demo` |

### Trying the real-time features

To see the real-time WebSocket features working:

1. Open two browser tabs (or use two different browsers)
2. In tab 1: log in as `apollo_hospital@medlink.demo` (Hospital Admin dashboard)
3. In tab 2: log in as `amit@medlink.demo` (Patient)
4. In tab 2: go to "Emergency" and send an SOS with your location
5. In tab 1: watch the new emergency request appear instantly on the Hospital dashboard (no refresh)
6. In tab 1: click "Accept" on the emergency
7. In tab 2: watch the status update to "Accepted" in real-time

To see live ambulance tracking:
1. In a third tab: log in as `driver1@medlink.demo`
2. Toggle "Go On Duty"
3. The driver's location will appear on the patient's ambulance tracking map and update every 5 seconds

---

## Summary

Plan 5 completed the MedLink project. Here is what was accomplished:

**Data layer**: The seed script fills the database with 3 patients, 5 Indian hospitals with real GPS coordinates, 10 doctors across specializations, 6 blood donors with different blood groups, 4 ambulance drivers, and sample transactions. The idempotent upsert pattern makes it safe to run multiple times.

**Features**: Three production-essential features were added — forgot password (with secure token-based reset, 1-hour expiry, and email enumeration prevention), pagination (server-side LIMIT/OFFSET with PaginatedResult interface and Pagination UI component), and file uploads (Multer with diskStorage, 5MB limit, type validation, and instant preview with FileReader).

**Deployment**: Railway hosts the NestJS API in a Docker container with multi-stage builds. Netlify serves the React frontend from a global CDN. The netlify.toml SPA redirect rule makes React Router work on direct URL access. The API proxy redirect eliminates CORS issues. GitHub Actions runs lint, typecheck, tests, and build on every push.

**Documentation**: The README covers the entire project for anyone landing on the GitHub repository. DEPLOYMENT.md provides a step-by-step guide for deploying to Railway and Netlify with troubleshooting.

After completing all 5 plans, MedLink is a production-grade, deployable, full-stack healthcare platform demonstrating: React 18, NestJS 10, PostgreSQL, TypeORM, Socket.IO real-time, JWT authentication, TypeScript monorepo, Docker, GitHub Actions CI/CD, and cloud deployment.
