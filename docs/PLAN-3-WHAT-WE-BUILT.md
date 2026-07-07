# MedLink Plan 3 — What We Built, How, and Why

> This document explains everything done in Plan 3 (all feature modules + real-time) in plain language.
> No prior knowledge assumed. Every decision explained from scratch.

---

## Table of Contents

1. [What Plan 3 Does](#1-what-plan-3-does)
2. [The Module Pattern — How Every Feature Is Structured](#2-the-module-pattern)
3. [Hospitals Module](#3-hospitals-module)
4. [Doctors Module](#4-doctors-module)
5. [Emergency Module — The SOS System](#5-emergency-module)
6. [Blood Module](#6-blood-module)
7. [Bookings Module](#7-bookings-module)
8. [Prescriptions Module](#8-prescriptions-module)
9. [Ambulance Module](#9-ambulance-module)
10. [Notifications Module](#10-notifications-module)
11. [The WebSocket Gateway — Real-Time Communication](#11-the-websocket-gateway)
12. [How Socket.IO Works](#12-how-socketio-works)
13. [AppModule — Wiring Everything Together](#13-appmodule)
14. [The Build Pipeline Fix](#14-the-build-pipeline-fix)
15. [The Complete File List](#15-complete-file-list)
16. [The Full API — All 47 Endpoints](#16-the-full-api)
17. [What the API Looks Like Running](#17-what-the-api-looks-like-running)
18. [What Comes Next](#18-what-comes-next)

---

## 1. What Plan 3 Does

Plan 2 gave us authentication — users can register, log in, and prove who they are. Plan 3 adds all the actual features of MedLink:

- Hospitals can be searched and their resources managed
- Doctors can be added, edited, removed per hospital
- Patients can send SOS emergency alerts and hospitals can respond
- Blood donors can be found and blood requests managed
- Doctors can be booked for appointments
- Prescriptions can be issued and viewed
- Ambulance drivers can share live GPS location
- In-app notifications system
- Real-time updates via Socket.IO (emergency alerts broadcast instantly, blood requests pushed to donors, ambulance location streamed to patient)

After Plan 3, the entire backend is complete — **47 REST endpoints + 9 real-time WebSocket events**.

---

## 2. The Module Pattern

Every feature in Plan 3 follows the exact same structure. Understanding this pattern once means you understand all 8 modules.

```
hospitals/
├── dto/
│   ├── hospital-filters.dto.ts    ← what's allowed in query/body
│   └── update-resources.dto.ts    ← what's allowed for updates
├── hospitals.service.ts            ← the business logic
├── hospitals.service.spec.ts       ← the tests
├── hospitals.controller.ts         ← the HTTP endpoints
└── hospitals.module.ts             ← wires it all together
```

### The flow of a request

```
HTTP Request → Controller → Service → Repository (TypeORM) → PostgreSQL
HTTP Response ← Controller ← Service ← Repository ←————————
```

**Controller** — Handles HTTP. Reads request body/params/query. Calls service. Returns result.

**Service** — Contains all logic. Talks to the database via TypeORM repository. Throws exceptions if something is wrong.

**Repository** — TypeORM auto-generates this. You inject it with `@InjectRepository(HospitalEntity)` and get methods like `findOne`, `find`, `save`, `delete`.

**DTO** (Data Transfer Object) — Defines and validates the shape of incoming data. If a required field is missing or has the wrong type, NestJS returns 400 Bad Request automatically.

### Why this separation?

- **Controller stays thin** — just HTTP mechanics. No logic.
- **Service is testable** — you can test it with a mock repository, no HTTP, no database needed.
- **DTO validates at the boundary** — bad data never reaches your service.

---

## 3. Hospitals Module

### What it does

- `GET /api/v1/hospitals` — list all hospitals, filter by city or ICU availability
- `GET /api/v1/hospitals/nearby?lat=X&lng=Y` — find hospitals within GPS radius using the Haversine formula
- `GET /api/v1/hospitals/dashboard` — hospital admin sees their own hospital (protected: hospital role only)
- `PUT /api/v1/hospitals/resources` — hospital admin updates ICU beds, ambulance counts (protected: hospital role only)
- `GET /api/v1/hospitals/:id` — get one hospital by ID (with doctors list loaded)
- `GET /api/v1/hospitals/:id/doctors` — get just the doctors at a hospital
- `GET /api/v1/hospitals/:id/resources` — get just the resource counts

### The Haversine formula (nearby hospitals)

```typescript
findNearby(lat: number, lng: number, radiusKm = 25): Promise<HospitalEntity[]> {
  return this.hospitalRepo
    .createQueryBuilder('h')
    .where(
      `(6371 * acos(cos(radians(:lat)) * cos(radians(h.latitude)) *
        cos(radians(h.longitude) - radians(:lng)) +
        sin(radians(:lat)) * sin(radians(h.latitude)))) < :radius`,
      { lat, lng, radius: radiusKm },
    )
    .orderBy('distance', 'ASC')
    .getMany();
}
```

This is a SQL query that calculates the straight-line distance between two GPS points using the **Haversine formula** — the formula that accounts for the Earth being a sphere (not flat). `6371` is the Earth's radius in km.

A patient at latitude 19.07, longitude 72.87 (Mumbai) asking for hospitals within 25km gets back all hospitals sorted by distance. This is how "find hospitals near me" works.

### `HospitalFiltersDto`

```typescript
export class HospitalFiltersDto {
  @IsOptional() @IsString() city?: string;
  @IsOptional() @Transform(({ value }) => value === 'true') @IsBoolean() icuAvailable?: boolean;
  @IsOptional() @Type(() => Number) @IsNumber() lat?: number;
  // ...
}
```

The `@Transform(({ value }) => value === 'true')` is important. HTTP query strings are always text. When a patient calls `GET /hospitals?icuAvailable=true`, the `true` arrives as the string `"true"`, not the boolean `true`. The transform converts it. Without this, `@IsBoolean()` would reject `"true"` because it's a string.

### `HospitalsService` is exported

```typescript
@Module({
  exports: [HospitalsService],  // ← other modules can use this
})
export class HospitalsModule {}
```

`HospitalsService` is exported because other modules (Doctors, Emergency, Bookings) need it. For example, when a hospital admin accepts an emergency request, the controller needs to know which hospital they manage — it calls `hospitalsService.findByUserId(user.id)` to look it up.

---

## 4. Doctors Module

### What it does

- `POST /api/v1/doctors` — hospital admin adds a doctor to their hospital
- `PUT /api/v1/doctors/:id` — update doctor name, speciality, availability
- `DELETE /api/v1/doctors/:id` — remove doctor from hospital

All 3 endpoints require `Role.HOSPITAL`. The guard chain is:

```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.HOSPITAL)
@Controller('doctors')
export class DoctorsController { ... }
```

By putting guards at the **class level** instead of method level, every endpoint in the controller inherits them automatically. No need to repeat on each method.

### Security: ownership check

```typescript
async update(id: string, hospitalId: string, dto: UpdateDoctorDto): Promise<DoctorEntity> {
  const doctor = await this.doctorRepo.findOne({ where: { id } });
  if (!doctor) throw new NotFoundException(`Doctor ${id} not found`);
  if (doctor.hospitalId !== hospitalId) throw new ForbiddenException();  // ← KEY
  // ...
}
```

A hospital admin can only update doctors that belong to their hospital. Without this check, Hospital A's admin could edit Hospital B's doctors. The controller finds the hospital via `hospitalsService.findByUserId(user.id)` and passes the hospital ID to the service, which verifies ownership.

### `UpdateDoctorDto` uses `PartialType`

```typescript
export class UpdateDoctorDto extends PartialType(CreateDoctorDto) {
  @IsOptional() @IsBoolean() isAvailable?: boolean;
}
```

`PartialType(CreateDoctorDto)` automatically makes all fields from `CreateDoctorDto` optional in `UpdateDoctorDto`. So for a PUT/PATCH, you can send just `{ "speciality": "Cardiology" }` without having to resend everything. NestJS generates this for you — one line instead of redefining all fields as optional.

---

## 5. Emergency Module — The SOS System

This is the most critical module. A patient sends an SOS alert with their GPS location and a hospital responds.

### Endpoints

- `POST /api/v1/emergency` — patient creates SOS (patient role only)
- `GET /api/v1/emergency` — hospital sees all pending SOS requests (hospital role only)
- `GET /api/v1/emergency/my` — patient sees their own SOS history (patient role only)
- `PUT /api/v1/emergency/:id/accept` — hospital accepts the SOS
- `PUT /api/v1/emergency/:id/reject` — hospital rejects
- `PUT /api/v1/emergency/:id/cancel` — patient cancels
- `PUT /api/v1/emergency/:id/resolve` — hospital marks as resolved

### The lifecycle

```
pending → accepted (hospital assigned)
pending → rejected (hospital can't help)
pending → cancelled (patient cancels)
accepted → resolved (emergency handled)
```

### Status transitions in code

```typescript
async accept(id: string, hospitalId: string): Promise<EmergencyRequestEntity> {
  const request = await this.findById(id);
  request.status = EmergencyStatus.ACCEPTED;
  request.hospitalId = hospitalId;  // ← link hospital to request
  return this.emergencyRepo.save(request);
}

async resolve(id: string): Promise<EmergencyRequestEntity> {
  const request = await this.findById(id);
  request.status = EmergencyStatus.RESOLVED;
  request.resolvedAt = new Date();  // ← timestamp when resolved
  return this.emergencyRepo.save(request);
}
```

### Cancel ownership check

```typescript
async cancel(id: string, patientId: string): Promise<EmergencyRequestEntity> {
  const request = await this.findById(id);
  if (request.patientId !== patientId) throw new ForbiddenException();  // ← can only cancel your own
  // ...
}
```

A patient can only cancel their own emergency request — not someone else's.

### Real-time connection (Plan 3 gateway)

When a hospital **accepts** an emergency, it's not enough to just update the database. The patient needs to know instantly. The WebSocket gateway (Task 6) handles this — `emitEmergencyUpdated(patientId, emergency)` pushes the update to the patient's browser in real time without them refreshing.

---

## 6. Blood Module

### What it does

**For patients:**
- `GET /api/v1/blood/donors?bloodGroup=O+&city=Mumbai` — search available donors
- `POST /api/v1/blood/requests` — create a blood request
- `GET /api/v1/blood/requests/my` — see your blood requests
- `PUT /api/v1/blood/requests/:id/cancel` — cancel a request

**For donors:**
- `GET /api/v1/blood/requests/pending` — see pending blood requests that match
- `PUT /api/v1/blood/requests/:id/fulfill` — fulfill a request
- `GET /api/v1/blood/dashboard` — donor stats (donations, lives saved)
- `PUT /api/v1/blood/availability` — toggle whether you're available to donate

### The donor search

```typescript
searchDonors(filters: SearchDonorsDto): Promise<BloodDonorEntity[]> {
  const qb = this.donorRepo
    .createQueryBuilder('d')
    .leftJoinAndSelect('d.user', 'u')  // ← also load user (for name/contact)
    .where('d.is_available = true');    // ← only available donors
  if (filters.bloodGroup) qb.andWhere('d.blood_group = :bg', { bg: filters.bloodGroup });
  if (filters.city) qb.andWhere('LOWER(d.city) = LOWER(:city)', { city: filters.city });
  return qb.getMany();
}
```

`leftJoinAndSelect('d.user', 'u')` joins the `users` table so you get the donor's name and contact info alongside their blood group. Without the join, you'd get only the donor's blood group and ID with no way to contact them.

`LOWER(d.city) = LOWER(:city)` makes city search case-insensitive — `Mumbai` and `mumbai` both work.

### Fulfilling a blood request — two updates in one

```typescript
async fulfill(id: string, donorUserId: string): Promise<BloodRequestEntity> {
  const donor = await this.donorRepo.findOne({ where: { userId: donorUserId } });
  const request = await this.requestRepo.findOne({ where: { id } });

  // Update 1: mark request as fulfilled, link donor
  request.status = BloodRequestStatus.FULFILLED;
  request.donorId = donor.id;

  // Update 2: increment donor's stats
  donor.totalDonations += 1;
  donor.lastDonatedAt = new Date();

  await this.donorRepo.save(donor);
  return this.requestRepo.save(request);
}
```

One API call updates two tables — the blood request is marked fulfilled AND the donor's donation count is incremented. This keeps the data consistent.

### "Lives saved" calculation

```typescript
return {
  totalDonations: donor.totalDonations,
  livesSaved: donor.totalDonations * 3,  // one donation can save up to 3 lives
  // ...
};
```

One blood donation can potentially save up to 3 lives (red cells, plasma, platelets can go to different patients). The dashboard multiplies donations × 3 to show a motivating "lives saved" number.

---

## 7. Bookings Module

### What it does

Patients book appointments with doctors or ICU beds.

- `POST /api/v1/bookings` — patient creates a booking
- `GET /api/v1/bookings/my` — patient sees their booking history
- `GET /api/v1/bookings/hospital` — hospital admin sees all incoming bookings
- `PUT /api/v1/bookings/:id/confirm` — hospital confirms
- `PUT /api/v1/bookings/:id/cancel` — either side cancels
- `PUT /api/v1/bookings/:id/complete` — hospital marks as completed

### Status pattern

All status changes go through one method:

```typescript
async updateStatus(id: string, status: BookingStatus): Promise<BookingEntity> {
  const booking = await this.bookingRepo.findOne({ where: { id } });
  if (!booking) throw new NotFoundException(`Booking ${id} not found`);
  booking.status = status;
  return this.bookingRepo.save(booking);
}
```

Then the controller calls it with the right status:

```typescript
@Put(':id/confirm')
confirm(@Param('id') id: string) {
  return this.bookingsService.updateStatus(id, BookingStatus.CONFIRMED);
}

@Put(':id/complete')
complete(@Param('id') id: string) {
  return this.bookingsService.updateStatus(id, BookingStatus.COMPLETED);
}
```

This avoids duplicating logic. One method handles all status changes — `confirm`, `cancel`, `complete` are just different callers.

### `CreateBookingDto` uses `@IsDateString()`

```typescript
@IsDateString() scheduledAt: string;
```

`@IsDateString()` validates that the input is a valid ISO 8601 date string like `"2026-07-15T10:30:00Z"`. The service then converts it: `scheduledAt: new Date(dto.scheduledAt)`. This is the safe way to receive timestamps — strings are validated, then converted.

---

## 8. Prescriptions Module

### What it does

Hospital doctors issue prescriptions linked to a patient (optionally linked to a booking).

- `POST /api/v1/prescriptions` — hospital creates a prescription
- `GET /api/v1/prescriptions/my` — patient views their prescriptions
- `GET /api/v1/prescriptions/:id` — get one prescription (doctor or patient)

### The `medications` field is JSONB

```typescript
@Column({ type: 'jsonb', default: [] })
medications: Array<{ name: string; dose: string; frequency: string; duration: string }>;
```

`jsonb` is PostgreSQL's binary JSON column type. It stores an array of medication objects directly in one column:

```json
[
  { "name": "Amoxicillin", "dose": "500mg", "frequency": "3x daily", "duration": "7 days" },
  { "name": "Paracetamol", "dose": "500mg", "frequency": "as needed", "duration": "3 days" }
]
```

Why not a separate `medications` table? Because medications only make sense in the context of their prescription — you'd never query medications without querying the prescription first. Storing them as JSONB in one row is simpler and faster.

### Nested validation with `@ValidateNested`

```typescript
export class MedicationDto {
  @IsString() name!: string;
  @IsString() dose!: string;
  @IsString() frequency!: string;
  @IsString() duration!: string;
}

export class CreatePrescriptionDto {
  @IsArray()
  @ValidateNested({ each: true })  // ← validate each item in the array
  @Type(() => MedicationDto)       // ← using MedicationDto for each item
  medications!: MedicationDto[];
}
```

`@ValidateNested({ each: true })` tells class-validator to apply `MedicationDto` validation to every object in the `medications` array. Without this, someone could send `medications: [{ name: 123 }]` and it would pass.

---

## 9. Ambulance Module

### What it does

Ambulance drivers manage their on-duty status and share live GPS location.

- `PUT /api/v1/ambulance/duty` — driver toggles on/off duty
- `PUT /api/v1/ambulance/location` — driver sends their current GPS coordinates
- `GET /api/v1/ambulance/requests` — driver sees nearby emergency requests
- `GET /api/v1/ambulance/track/:driverId` — patient tracks a driver's live location

### Location update

```typescript
async updateLocation(userId: string, dto: UpdateLocationDto): Promise<AmbulanceDriverEntity> {
  const driver = await this.driverRepo.findOne({ where: { userId } });
  if (!driver) throw new NotFoundException('Driver profile not found');
  driver.latitude = dto.latitude;
  driver.longitude = dto.longitude;
  driver.lastLocationAt = new Date();  // ← timestamp of last ping
  return this.driverRepo.save(driver);
}
```

The driver's app calls `PUT /ambulance/location` every 5 seconds when on duty. The database is updated each time. Patients calling `GET /ambulance/track/:driverId` get the latest coordinates.

For live tracking on the patient's screen, the REST API alone isn't enough — you'd have to poll every second. That's why the WebSocket gateway (Task 6) also handles this: drivers emit `driver:location_update` events in real time, and the gateway broadcasts `driver:location_broadcast` to the patient watching.

---

## 10. Notifications Module

### What it does

Stores in-app notifications and lets users mark them as read.

- `GET /api/v1/notifications` — get your last 50 notifications
- `PUT /api/v1/notifications/:id/read` — mark one as read
- `PUT /api/v1/notifications/read-all` — mark all as read

### `take: 50`

```typescript
findByUser(userId: string): Promise<NotificationEntity[]> {
  return this.notificationRepo.find({
    where: { userId },
    order: { createdAt: 'DESC' },
    take: 50,  // ← limit to 50 most recent
  });
}
```

`take: 50` is a database LIMIT. Without it, a user who's been using the app for years might have thousands of notifications and every request would fetch all of them. 50 is a sensible limit for what fits on screen.

### How notifications are created

`NotificationsService.create()` is called by **other services**, not directly by users. For example, when an emergency is accepted, the emergency service would call `notificationsService.create(patientId, NotificationType.EMERGENCY, 'Emergency accepted', 'Apollo Hospital has accepted your SOS request')`. The patient then sees this in their notification bell.

---

## 11. The WebSocket Gateway — Real-Time Communication

This is what makes MedLink feel live. Without the gateway, everything is "pull" — you have to refresh to see updates. With it, updates arrive at the user's screen the instant they happen.

### What is Socket.IO?

Socket.IO is a library that maintains a persistent two-way connection between the browser and the server (a WebSocket connection). Unlike HTTP (request → response → connection closed), a WebSocket stays open:

```
Browser ←——————————————————→ Server (connection stays open)
         can send messages both ways at any time
```

### The `MedlinkGateway` class

```typescript
@WebSocketGateway({ cors: { origin: '*' }, namespace: '/' })
export class MedlinkGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;  // the Socket.IO server instance
  // ...
}
```

`@WebSocketGateway` turns this class into a Socket.IO server. `@WebSocketServer()` injects the Socket.IO `Server` object so we can emit events.

### Authentication on WebSocket connect

```typescript
async handleConnection(client: Socket) {
  try {
    // Read JWT from handshake
    const token = client.handshake.auth?.token || 
                  client.handshake.headers?.authorization?.replace('Bearer ', '');
    if (!token) { client.disconnect(); return; }

    // Verify it
    const payload = this.jwtService.verify(token, { secret: this.config.get('JWT_SECRET') });

    // Store user info on the socket
    client.data.userId = payload.sub;
    client.data.role = payload.role;

    // Join rooms based on role
    client.join(`patient:${payload.sub}`);                    // everyone joins their personal room
    if (payload.role === 'hospital') client.join('hospitals'); // hospital admins join broadcast room
    if (payload.role === 'donor') client.join('donors');       // donors join donor broadcast room

  } catch {
    client.disconnect();  // invalid token → kick
  }
}
```

The frontend sends the JWT when connecting:
```javascript
const socket = io('http://localhost:3000', {
  auth: { token: 'eyJhbGci...' }
});
```

The server validates it exactly like HTTP requests. Only valid, active users can connect.

---

## 12. How Socket.IO Works

### Rooms — targeted broadcasts

A Socket.IO "room" is a named group of connections. You can emit to a room and all connected clients in that room receive it.

```typescript
// Send only to hospital admins
this.server.to('hospitals').emit('emergency:new', emergencyData);

// Send only to patient with ID uuid-1
this.server.to('patient:uuid-1').emit('emergency:updated', emergencyData);

// Send to all available donors
this.server.to('donors').emit('blood:new_request', requestData);

// Send to everyone (no .to())
this.server.emit('hospital:resource_update', resourceData);
```

When a patient registers a SOS:
1. `EmergencyService.create()` saves the request to the database
2. `MedlinkGateway.emitNewEmergency(emergency)` broadcasts `emergency:new` to the `hospitals` room
3. Every connected hospital admin's browser receives it instantly
4. Their dashboard updates showing the new SOS request without any refresh

### The 9 real-time events

| Event | Direction | Who receives | When |
|---|---|---|---|
| `emergency:new` | Server → `hospitals` room | All hospital admins | Patient sends SOS |
| `emergency:updated` | Server → `patient:<id>` | That specific patient | Hospital accepts/rejects |
| `emergency:driver_dispatched` | Server → `patient:<id>` | That specific patient | Driver assigned |
| `blood:new_request` | Server → `donors` room | All available donors | Patient requests blood |
| `blood:request_fulfilled` | Server → `patient:<id>` | That specific patient | Donor fulfills request |
| `driver:location_update` | Client → Server | Server (from driver) | Driver sends GPS |
| `driver:location_broadcast` | Server → `patient:<id>` | Patient tracking driver | Relayed from driver |
| `hospital:resource_update` | Server → everyone | All connected users | Hospital updates ICU count |
| `notification:new` | Server → `patient:<id>` | Specific user | Any in-app notification |

### Driver location relay

```typescript
@SubscribeMessage('driver:location_update')
handleDriverLocation(
  @MessageBody() data: { lat: number; lng: number },
  @ConnectedSocket() client: Socket
) {
  const driverId = client.data.userId as string;
  // Relay to the patient room named after the driverId
  client.to(`patient:${driverId}`).emit('driver:location_broadcast', {
    lat: data.lat,
    lng: data.lng,
    driverId,
  });
}
```

The driver emits their GPS coordinates. The server immediately relays it to `patient:<driverId>` room. The patient watching that driver's ambulance on their map sees the marker move in real time.

Why name the patient room after the driver ID? Because once a driver is dispatched to a patient, the patient needs to track that specific driver. Using `patient:<driverId>` as the room name is a convention — the patient's frontend subscribes to that room when tracking starts.

---

## 13. AppModule — Wiring Everything Together

```typescript
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),      // .env variables
    ThrottlerModule.forRoot([...]),                  // rate limiting
    DatabaseModule,                                  // PostgreSQL connection
    UsersModule,                                     // user lookup
    AuthModule,                                      // JWT auth
    HospitalsModule,                                 // hospital features
    DoctorsModule,                                   // doctor management
    EmergencyModule,                                 // SOS system
    BloodModule,                                     // blood donation
    BookingsModule,                                  // appointments
    PrescriptionsModule,                             // prescriptions
    AmbulanceModule,                                 // driver tracking
    NotificationsModule,                             // notifications
    GatewaysModule,                                  // Socket.IO WebSocket
    HealthModule,                                    // GET /health
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard }, // rate limit on every route
  ],
})
export class AppModule {}
```

This one file is the "table of contents" of the entire API. Every module registers its controllers (which expose HTTP endpoints) and provides its services (which contain logic). NestJS reads this and builds the whole app.

### How NestJS builds the dependency graph

When NestJS starts:
1. It reads `AppModule.imports`
2. For each module, it instantiates all providers (services)
3. Injects dependencies automatically — `EmergencyController` needs `EmergencyService` and `HospitalsService`, NestJS provides them
4. Registers all controllers → creates HTTP routes
5. Starts listening for requests

This is **dependency injection** — you declare what you need, the framework provides it. You never write `new EmergencyService()` — NestJS handles that.

---

## 14. The Build Pipeline Fix

After writing all the code, we discovered a bug with how the monorepo build worked. Here's what happened and how we fixed it.

### The problem

When you write `import { Role } from '@medlink/shared'` in the API, TypeScript resolves this via the `paths` config in `tsconfig.json`:

```json
"paths": {
  "@medlink/shared": ["../../packages/shared/src/index.ts"]
}
```

This works perfectly for **development** — TypeScript reads the source `.ts` files directly.

But for **production build**, NestJS compiles the API to plain JavaScript. When Node.js then runs `dist/main.js`, it tries to import from `packages/shared/src/index.ts` — a TypeScript file. Node.js can't read TypeScript. Crash.

### The solution

1. **Build `packages/shared` to JavaScript first**
   - Added a `build` script to `packages/shared`
   - Uses `tsconfig.build.json` with `"module": "commonjs"` and `"outDir": "./dist"`
   - Produces `packages/shared/dist/index.js` (and `.d.ts` declaration files)

2. **Tell the API build to use the compiled JS**
   - `apps/api/tsconfig.build.json` overrides the paths alias:
   ```json
   {
     "extends": "./tsconfig.json",
     "compilerOptions": {
       "paths": {
         "@medlink/shared": ["../../packages/shared/dist/index.d.ts"]
       }
     }
   }
   ```
   - During production build only, `@medlink/shared` resolves to the compiled declaration file
   - Node.js runtime loads `index.js` instead of `index.ts`

3. **Turborepo `"dependsOn": ["^build"]` ensures order**
   - The `^` means "build my dependencies first"
   - So `pnpm turbo build` builds `packages/shared` before `apps/api` automatically

### Two tsconfig files — why

| File | Used for | @medlink/shared resolves to |
|---|---|---|
| `tsconfig.json` | Development + tests | `packages/shared/src/index.ts` (TypeScript source) |
| `tsconfig.build.json` | Production build | `packages/shared/dist/index.d.ts` (compiled JS) |

The `dev` command (`nest start --watch`) uses `tsconfig.json` — it can read TypeScript directly via `ts-node`.
The `build` command (`nest build`) uses `tsconfig.build.json` — it compiles to plain JavaScript.

This is a standard pattern in TypeScript monorepos.

---

## 15. Complete File List

Every file created in Plan 3:

```
apps/api/src/
├── hospitals/
│   ├── dto/
│   │   ├── hospital-filters.dto.ts    ← city, icuAvailable, lat, lng, radiusKm filters
│   │   └── update-resources.dto.ts    ← icuBedsTotal, icuBedsAvailable, ambulances, doctors
│   ├── hospitals.service.ts            ← findAll, findNearby, findById, findByUserId, updateResources
│   ├── hospitals.service.spec.ts       ← 3 unit tests
│   ├── hospitals.controller.ts         ← 7 endpoints
│   └── hospitals.module.ts             ← exports HospitalsService
│
├── doctors/
│   ├── dto/
│   │   ├── create-doctor.dto.ts        ← name, speciality, phone
│   │   └── update-doctor.dto.ts        ← PartialType(CreateDoctorDto) + isAvailable
│   ├── doctors.service.ts              ← create, findByHospital, update, remove
│   ├── doctors.service.spec.ts         ← 2 unit tests
│   ├── doctors.controller.ts           ← 3 endpoints (hospital role only)
│   └── doctors.module.ts
│
├── emergency/
│   ├── dto/
│   │   └── create-emergency.dto.ts     ← type, patientLat, patientLng, description
│   ├── emergency.service.ts            ← create, findPending, findByPatient, accept, reject, cancel, resolve, findById
│   ├── emergency.service.spec.ts       ← 3 unit tests
│   ├── emergency.controller.ts         ← 7 endpoints
│   └── emergency.module.ts
│
├── blood/
│   ├── dto/
│   │   ├── create-blood-request.dto.ts ← bloodGroup, unitsRequired, urgency
│   │   └── search-donors.dto.ts        ← bloodGroup, city, lat, lng
│   ├── blood.service.ts                ← searchDonors, createRequest, findPatientRequests, findPendingRequests, fulfill, cancel, getDonorDashboard, toggleAvailability
│   ├── blood.service.spec.ts           ← 3 unit tests
│   ├── blood.controller.ts             ← 8 endpoints
│   └── blood.module.ts
│
├── bookings/
│   ├── dto/
│   │   └── create-booking.dto.ts       ← doctorId, hospitalId, type, scheduledAt, notes
│   ├── bookings.service.ts             ← create, findByPatient, findByHospital, updateStatus
│   ├── bookings.controller.ts          ← 6 endpoints
│   └── bookings.module.ts
│
├── prescriptions/
│   ├── dto/
│   │   └── create-prescription.dto.ts  ← patientId, doctorId, bookingId, diagnosis, medications[], notes
│   ├── prescriptions.service.ts        ← create, findByPatient, findById
│   ├── prescriptions.controller.ts     ← 3 endpoints
│   └── prescriptions.module.ts
│
├── ambulance/
│   ├── dto/
│   │   └── update-location.dto.ts      ← latitude, longitude
│   ├── ambulance.service.ts            ← toggleDuty, updateLocation, getNearbyRequests, getDriverLocation
│   ├── ambulance.controller.ts         ← 4 endpoints
│   └── ambulance.module.ts
│
├── notifications/
│   ├── notifications.service.ts        ← create, findByUser, markRead, markAllRead
│   ├── notifications.controller.ts     ← 3 endpoints
│   └── notifications.module.ts
│
├── gateways/
│   ├── medlink.gateway.ts              ← WebSocket gateway (JWT auth, rooms, 6 emit methods, 1 listener)
│   └── gateways.module.ts
│
└── app.module.ts                       ← Updated: all 8 modules + gateway registered

packages/shared/
├── tsconfig.build.json                 ← New: production build config (commonjs output)
└── dist/                               ← New: compiled JS output (gitignored)
    ├── index.js
    ├── index.d.ts
    ├── enums/
    ├── types/
    └── constants/

apps/api/
├── tsconfig.build.json                 ← Updated: overrides paths to use compiled shared
└── package.json                        ← Updated: start script, build scripts
```

---

## 16. The Full API — All 47 Endpoints

| Module | Method | Path | Who Can Call |
|---|---|---|---|
| **auth** | POST | /auth/register | Public |
| auth | POST | /auth/login | Public |
| auth | POST | /auth/refresh | Public |
| auth | POST | /auth/logout | Any logged in |
| auth | GET | /auth/me | Any logged in |
| **hospitals** | GET | /hospitals | Any logged in |
| hospitals | GET | /hospitals/nearby | Any logged in |
| hospitals | GET | /hospitals/dashboard | Hospital only |
| hospitals | PUT | /hospitals/resources | Hospital only |
| hospitals | GET | /hospitals/:id | Any logged in |
| hospitals | GET | /hospitals/:id/doctors | Any logged in |
| hospitals | GET | /hospitals/:id/resources | Any logged in |
| **doctors** | POST | /doctors | Hospital only |
| doctors | PUT | /doctors/:id | Hospital only |
| doctors | DELETE | /doctors/:id | Hospital only |
| **emergency** | POST | /emergency | Patient only |
| emergency | GET | /emergency | Hospital only |
| emergency | GET | /emergency/my | Patient only |
| emergency | PUT | /emergency/:id/accept | Hospital only |
| emergency | PUT | /emergency/:id/reject | Hospital only |
| emergency | PUT | /emergency/:id/cancel | Patient only |
| emergency | PUT | /emergency/:id/resolve | Hospital only |
| **blood** | GET | /blood/donors | Any logged in |
| blood | POST | /blood/requests | Patient only |
| blood | GET | /blood/requests/my | Patient only |
| blood | GET | /blood/requests/pending | Donor only |
| blood | PUT | /blood/requests/:id/fulfill | Donor only |
| blood | PUT | /blood/requests/:id/cancel | Patient only |
| blood | GET | /blood/dashboard | Donor only |
| blood | PUT | /blood/availability | Donor only |
| **bookings** | POST | /bookings | Patient only |
| bookings | GET | /bookings/my | Patient only |
| bookings | GET | /bookings/hospital | Hospital only |
| bookings | PUT | /bookings/:id/confirm | Hospital only |
| bookings | PUT | /bookings/:id/cancel | Any logged in |
| bookings | PUT | /bookings/:id/complete | Hospital only |
| **prescriptions** | POST | /prescriptions | Hospital only |
| prescriptions | GET | /prescriptions/my | Patient only |
| prescriptions | GET | /prescriptions/:id | Any logged in |
| **ambulance** | PUT | /ambulance/duty | Driver only |
| ambulance | PUT | /ambulance/location | Driver only |
| ambulance | GET | /ambulance/requests | Driver only |
| ambulance | GET | /ambulance/track/:driverId | Any logged in |
| **notifications** | GET | /notifications | Any logged in |
| notifications | PUT | /notifications/:id/read | Any logged in |
| notifications | PUT | /notifications/read-all | Any logged in |
| **health** | GET | /health | Public |

All routes except `/health`, `/auth/register`, `/auth/login`, `/auth/refresh` require a valid JWT Bearer token.

---

## 17. What the API Looks Like Running

When you start the API (`pnpm dev` in `apps/api/`) and open `http://localhost:3000/api/docs`, you see Swagger UI with all 47 endpoints organized by tag:

```
auth          ← register, login, refresh, logout, me
hospitals     ← list, nearby, dashboard, resources, by-id, doctors, resources
doctors       ← create, update, delete
emergency     ← create, list-pending, my-history, accept, reject, cancel, resolve
blood         ← search-donors, create-request, my-requests, pending-requests, fulfill, cancel, dashboard, availability
bookings      ← create, my-history, hospital-bookings, confirm, cancel, complete
prescriptions ← create, my-history, by-id
ambulance     ← toggle-duty, update-location, nearby-requests, track-driver
notifications ← get-all, mark-read, mark-all-read
health        ← check
```

You can authenticate via the Authorize button (paste a JWT token), then try any endpoint directly from the browser. This is what you show in a demo or portfolio review.

### Starting locally

1. Start Docker Desktop
2. Run `docker-compose up postgres -d` (starts PostgreSQL)
3. Run `cd apps/api && pnpm dev` (starts NestJS)
4. Open `http://localhost:3000/api/docs`
5. Register a user, get the access token, authorize, test endpoints

---

## 18. What Comes Next

### Plan 4 — React Frontend

The backend is complete. Now we build what users actually see:

- **Landing page** — feature overview, register/login CTAs
- **Auth pages** — Login and Register forms with Zod validation
- **Patient dashboard** — stats (ICU beds available, nearby hospitals, donors), quick actions (SOS button, blood request)
- **Hospital search** — list with city filter, hospital detail with resources and doctors
- **Emergency page** — SOS button with GPS, real-time status updates via Socket.IO
- **Blood page** — donor search form, blood request form, match list
- **Hospital admin dashboard** — live emergency queue (real-time alerts), resource management
- **Donor dashboard** — availability toggle, pending requests with real-time alerts
- **Driver dashboard** — on-duty toggle, live location sharing every 5 seconds
- **Bookings, prescriptions, profiles** for all roles

Each page uses:
- **React Query** to fetch data from the API we just built
- **Zustand** to keep the logged-in user in memory
- **Socket.IO client** to listen for real-time events
- **Tailwind CSS** for styling with the components we already scaffolded

### Plan 5 — Seed + Deploy + README

- Fill the database with realistic Indian hospital data (Mumbai, Delhi, Bangalore, Chennai, Hyderabad)
- Deploy to Railway (API) and Vercel (frontend)
- Write a portfolio README that shows what the project does, the tech stack, live demo link, and setup instructions
