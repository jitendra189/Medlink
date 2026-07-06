# MedLink Plan 2 — What We Built, How, and Why

> This document explains everything done in Plan 2 (Database + Auth) in plain language.
> No prior knowledge assumed. Every decision explained from scratch.

---

## Table of Contents

1. [What Plan 2 Does](#1-what-plan-2-does)
2. [TypeORM — What Is It and Why?](#2-typeorm)
3. [The DataSource — Two Configs for One Database](#3-the-datasource)
4. [The Database Entities — Mapping Code to Tables](#4-the-database-entities)
5. [How Relationships Work](#5-how-relationships-work)
6. [The Exception Filter — Consistent Error Responses](#6-the-exception-filter)
7. [The Response Interceptor — Consistent Success Responses](#7-the-response-interceptor)
8. [The Users Module](#8-the-users-module)
9. [Authentication — How It Works](#9-authentication)
10. [JWT — What It Is and How We Use It](#10-jwt)
11. [The Auth DTOs — Validating Incoming Data](#11-the-auth-dtos)
12. [The JWT Strategy — Validating Tokens](#12-the-jwt-strategy)
13. [Guards and Decorators](#13-guards-and-decorators)
14. [The Auth Service — The Core Logic](#14-the-auth-service)
15. [Security Decisions in Depth](#15-security-decisions-in-depth)
16. [The Auth Controller — The HTTP Layer](#16-the-auth-controller)
17. [How Everything Wires Together](#17-how-everything-wires-together)
18. [Test-Driven Development (TDD) — What We Did](#18-tdd)
19. [The Complete File List](#19-complete-file-list)
20. [What the API Looks Like Now](#20-what-the-api-looks-like-now)
21. [What Comes Next](#21-what-comes-next)

---

## 1. What Plan 2 Does

Plan 1 gave us a running NestJS server with a single health endpoint. Plan 2 adds two massive things:

**A. The database layer** — TypeORM connects to PostgreSQL and defines all 11 tables (users, hospitals, blood donors, etc.) as TypeScript classes.

**B. Authentication** — Users can register, log in, get a token, use that token to prove who they are on every request, refresh the token, and log out.

After Plan 2:
- The API knows about all 11 database tables
- Any user can register and log in
- Every future API endpoint can say "only logged-in patients can call this" or "only hospital admins can call this"
- 18 unit tests passing

---

## 2. TypeORM

### What is TypeORM?

TypeORM is an **Object-Relational Mapper (ORM)**. Instead of writing raw SQL like:

```sql
INSERT INTO users (name, email, password_hash, role) VALUES ('Amit', 'amit@x.com', '...', 'patient');
SELECT * FROM users WHERE email = 'amit@x.com';
```

You write TypeScript:

```typescript
const user = userRepo.create({ name: 'Amit', email: 'amit@x.com', passwordHash: '...', role: Role.PATIENT });
await userRepo.save(user);

const found = await userRepo.findOne({ where: { email: 'amit@x.com' } });
```

TypeORM translates the TypeScript into SQL behind the scenes.

### Why use an ORM instead of raw SQL?

1. **Type safety** — TypeScript knows the shape of every row. If you typo `usre.naem`, TypeScript catches it at compile time.
2. **Relationships** — You can write `user.hospital` and TypeORM knows to do a JOIN query.
3. **Database portability** — Switch from PostgreSQL to MySQL by changing one config line. All queries work.
4. **Migrations** — TypeORM can compare your entity definitions to the actual database and generate the SQL to sync them.

### What is `synchronize: true`?

In development mode, TypeORM automatically creates/alters tables to match your entity definitions every time the server starts. If you add a `phone` column to `UserEntity`, TypeORM adds the column to the database automatically.

In production, `synchronize` is `false` — changes to the database are made via **migrations** (explicit, reviewed SQL scripts) to avoid accidents.

---

## 3. The DataSource — Two Configs for One Database

There are two TypeORM config files. This is intentional.

### `database.module.ts` — used by NestJS at runtime

```typescript
TypeOrmModule.forRootAsync({
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({
    type: 'postgres',
    host: config.get('DATABASE_HOST', 'localhost'),
    // ...
    synchronize: config.get('NODE_ENV') === 'development',
  }),
})
```

This runs when the NestJS app starts. It uses `ConfigService` to read environment variables from your `.env` file. It uses NestJS's dependency injection system.

### `data-source.ts` — used by the TypeORM CLI tool

```typescript
import * as dotenv from 'dotenv';
dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  // ...
});
```

This runs outside of NestJS, from the command line:
```bash
pnpm migration:generate
pnpm migration:run
```

The CLI doesn't know about NestJS modules or dependency injection. It just needs a plain `DataSource` object. That's why we have this separate file.

**Think of it this way:** The NestJS runtime and the CLI are two separate programs. Each needs its own way to connect to the database.

---

## 4. The Database Entities

### What is an entity?

An entity is a TypeScript class that maps to a database table. Each property maps to a column.

```typescript
@Entity('users')                    // creates/maps to the "users" table
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')   // id column, auto-generated UUID
  id: string;

  @Column({ length: 100 })          // varchar(100) column named "name"
  name: string;

  @Column({ name: 'password_hash' }) // column is named password_hash in DB
  passwordHash: string;              // but we access it as passwordHash in code
}
```

### Why UUIDs instead of sequential numbers (1, 2, 3)?

Sequential IDs are predictable. If your user ID is `42`, an attacker knows there are at least 42 users and can try `/api/v1/users/1`, `/api/v1/users/2`, etc. to enumerate them.

UUIDs (like `f47ac10b-58cc-4372-a567-0e02b2c3d479`) are random 128-bit values. Guessing one is computationally infeasible. For a healthcare platform handling patient data, this is essential.

### The `!` after properties

```typescript
@Column({ length: 100 })
name!: string;
```

The `!` is a **definite assignment assertion**. It tells TypeScript: "I know this property will always be set, even though I'm not setting it in the constructor." TypeORM sets these properties when it loads a row from the database. Without `!`, TypeScript's `strictPropertyInitialization` check would complain.

### The 11 entities we created

| Entity | Table | What it stores |
|---|---|---|
| `UserEntity` | `users` | Every person who registers (patient, hospital admin, donor, driver) |
| `HospitalEntity` | `hospitals` | Hospital details, ICU counts, resource availability |
| `BloodDonorEntity` | `blood_donors` | Donor blood group, location, availability |
| `AmbulanceDriverEntity` | `ambulance_drivers` | Driver on-duty status, live GPS location |
| `DoctorEntity` | `doctors` | Doctor name, speciality, which hospital they're at |
| `EmergencyRequestEntity` | `emergency_requests` | SOS alerts — who sent them, GPS location, status |
| `BloodRequestEntity` | `blood_requests` | Blood requests — type, urgency, who fulfilled |
| `BookingEntity` | `bookings` | Doctor/ICU appointments |
| `PrescriptionEntity` | `prescriptions` | Prescriptions from doctors to patients |
| `NotificationEntity` | `notifications` | In-app notifications (alerts, updates) |
| `RefreshTokenEntity` | `refresh_tokens` | Long-lived auth tokens stored in database |

---

## 5. How Relationships Work

### One-to-One

```typescript
// In UserEntity:
@OneToOne(() => HospitalEntity, (h) => h.user)
hospital: HospitalEntity;

// In HospitalEntity:
@OneToOne(() => UserEntity, (u) => u.hospital)
@JoinColumn({ name: 'user_id' })        // this side owns the foreign key
user: UserEntity;
```

This means one user account = one hospital profile. The `@JoinColumn` decorator says "put the foreign key column (`user_id`) in the `hospitals` table."

**Real world:** When a hospital admin registers, we create a `User` row and a `Hospital` row. They're linked by `hospital.user_id = user.id`.

### Many-to-One / One-to-Many

```typescript
// In HospitalEntity:
@OneToMany(() => DoctorEntity, (d) => d.hospital)
doctors: DoctorEntity[];   // one hospital has many doctors

// In DoctorEntity:
@ManyToOne(() => HospitalEntity, (h) => h.doctors)
@JoinColumn({ name: 'hospital_id' })
hospital: HospitalEntity;  // many doctors belong to one hospital
```

The foreign key (`hospital_id`) lives in the `doctors` table (the "many" side). One hospital can have 50 doctors, but each doctor belongs to exactly one hospital.

### Cascade Delete

```typescript
// In RefreshTokenEntity:
@ManyToOne(() => UserEntity, (u) => u.refreshTokens, { onDelete: 'CASCADE' })
user: UserEntity;
```

`CASCADE` means: if a user is deleted, all their refresh tokens are automatically deleted too. Without this, you'd have orphaned token rows with a `user_id` pointing to nothing.

---

## 6. The Exception Filter

### The problem it solves

Without a global exception filter, different errors produce inconsistent responses:

```json
// NestJS default for 404:
{ "statusCode": 404, "message": "Not Found" }

// NestJS default for validation error:
{ "statusCode": 400, "message": ["email must be a valid email"], "error": "Bad Request" }

// Unexpected crash:
{}  ← empty response with 500 status
```

The frontend has to handle 3 different shapes for errors. That's messy.

### The solution: `AllExceptionsFilter`

```typescript
@Catch()   // catches ALL exceptions, not just HttpExceptions
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;  // 500 for unexpected errors

    response.status(status).json({
      success: false,
      statusCode: status,
      message: '...',
      path: request.url,      // which URL caused the error
      timestamp: '...',       // when it happened
    });
  }
}
```

Now every error returns the same shape:
```json
{ "success": false, "statusCode": 400, "message": "email must be a valid email", "path": "/api/v1/auth/register", "timestamp": "2026-07-06T..." }
```

The frontend always checks `response.success` — simple and predictable.

---

## 7. The Response Interceptor

### The problem it solves

Without an interceptor, successful responses vary:

```json
// GET /hospitals returns:
[{ "id": "...", "name": "Apollo" }, { "id": "...", "name": "AIIMS" }]

// GET /auth/me returns:
{ "id": "...", "name": "Amit" }
```

Both are valid JSON but different shapes. The frontend needs to handle arrays and objects differently.

### The solution: `ResponseInterceptor`

```typescript
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => ({
        success: true,
        data,                                    // original response is wrapped here
        timestamp: new Date().toISOString(),
      })),
    );
  }
}
```

Now every successful response looks like:
```json
{ "success": true, "data": <original response>, "timestamp": "2026-07-06T..." }
```

The frontend always reads `response.data`. Consistent everywhere.

### How interceptors work in NestJS

An interceptor wraps around every request like a middleware sandwich:

```
Request → [Interceptor wraps] → Controller handler → [Interceptor wraps result] → Response
```

The `next.handle().pipe(map(...))` is RxJS (reactive programming). You receive the stream of the handler's output and transform it. `map` applies the wrapping to whatever the handler returns.

---

## 8. The Users Module

### What it does

The `UsersService` is a thin wrapper around the TypeORM `UserEntity` repository. It has 3 methods:

```typescript
findByEmail(email: string): Promise<UserEntity | null>
findById(id: string): Promise<UserEntity | null>
save(user: Partial<UserEntity>): Promise<UserEntity>
```

### Why a separate Users module?

The `AuthService` needs to look up users (to verify login, to find user by JWT sub). The `JwtStrategy` also needs to look up users (to validate every protected request). If both imported the repository directly, there'd be duplication.

Instead, both import `UsersModule` which exports `UsersService`. One service, two consumers, no duplication.

```
AuthModule imports UsersModule
JwtStrategy (inside AuthModule) uses UsersService
AuthService (inside AuthModule) uses UsersService
```

### `TypeOrmModule.forFeature([UserEntity])`

```typescript
@Module({
  imports: [TypeOrmModule.forFeature([UserEntity])],  // register this entity for this module
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
```

`forFeature` tells TypeORM: "this module needs to use the `users` table." It creates a `Repository<UserEntity>` that can be injected into services within this module. Without this, `@InjectRepository(UserEntity)` in `UsersService` would fail.

---

## 9. Authentication

### The two-token system

We use two types of tokens:

**Access Token (JWT)**
- Lives in memory / response body (never in localStorage or cookies for security)
- Expires after **15 minutes**
- Short-lived so a stolen token expires quickly
- Sent with every API request in the `Authorization: Bearer <token>` header

**Refresh Token**
- Stored in an **httpOnly cookie** (JavaScript cannot read it — XSS-proof)
- Expires after **7 days**
- Used only to get a new access token when the old one expires
- Stored in the database (`refresh_tokens` table) so we can revoke it

### The flow

```
1. User logs in → API returns:
   - access token in response body (15 min)
   - refresh token in httpOnly cookie (7 days, invisible to JS)

2. User makes API calls → sends access token in Authorization header

3. Access token expires after 15 min → API returns 401

4. Frontend calls POST /auth/refresh with no body
   - Browser automatically sends the refresh cookie
   - API finds the refresh token in DB, verifies it's not revoked/expired
   - Returns new access token + rotates refresh token (old one revoked, new one issued)

5. User logs out → POST /auth/logout
   - Refresh token marked as revoked in DB
   - Cookie cleared
   - Next refresh attempt fails
```

### Why 15 minutes for the access token?

If an access token is stolen (e.g., from a network log), it expires in 15 minutes. The attacker has a very short window. Compare to sessions that last hours or days.

### Why store refresh tokens in the database?

If refresh tokens were stateless (like JWTs), you couldn't revoke them. A user who logged out could still use their refresh token for 7 days. By storing them in the database with an `is_revoked` flag, we can invalidate any token instantly.

---

## 10. JWT

### What is a JWT?

A JWT (JSON Web Token) is a string with 3 parts separated by dots:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9  ← header (algorithm)
.eyJzdWIiOiJ1dWlkLTEiLCJlbWFpbCI6ImFtaXRAeC5jb20iLCJyb2xlIjoicGF0aWVudCIsImlhdCI6...}  ← payload
.abc123signaturehere  ← signature
```

The **payload** contains claims — facts about the user:
```json
{
  "sub": "uuid-1",        // subject (user ID)
  "email": "amit@x.com",
  "role": "patient",
  "iat": 1234567890,      // issued at (timestamp)
  "exp": 1234568790       // expires at (15 min later)
}
```

The **signature** is created by the server using a secret key (`JWT_SECRET`). No one can fake a valid signature without knowing the secret.

### How the server verifies a request

```
1. Client sends: Authorization: Bearer eyJhbGci...

2. Server extracts the token
3. Server decodes the payload (base64)
4. Server verifies the signature with JWT_SECRET
5. Server checks expiry (exp claim)
6. If all valid, extracts the user ID from sub claim
7. Looks up the user in the database
8. If user exists and is active, allows the request
```

### Why minimal payload?

Our JWT payload is just `{ sub, email, role }`. We deliberately exclude sensitive data. Even though the payload is base64-encoded (not encrypted), anyone who gets the token can decode the payload. We don't want name, address, medical data, etc. in there.

---

## 11. The Auth DTOs

DTOs (Data Transfer Objects) define what shape of data we accept from the client, and validate it automatically.

### `RegisterDto`

```typescript
export class RegisterDto {
  @IsString() @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain uppercase, lowercase, and number',
  })
  password: string;

  @IsEnum(Role)
  role: Role;
}
```

When a POST request hits `/api/v1/auth/register`, NestJS automatically:
1. Parses the JSON body
2. Creates a `RegisterDto` instance
3. Runs all the `@Is*` validators
4. If any fail, returns a 400 with specific error messages
5. If all pass, calls the controller method with the validated object

Without DTOs, you'd write all that validation logic manually. With DTOs, one class handles both the schema definition (for Swagger) and the runtime validation.

### The `@Matches` password validator

```typescript
@Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
  message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
})
```

This is a **regex** (regular expression) that checks:
- `(?=.*[a-z])` — at least one lowercase letter
- `(?=.*[A-Z])` — at least one uppercase letter
- `(?=.*\d)` — at least one digit

`Test@12345` passes. `password` fails. `PASSWORD123` fails. This forces minimum password strength.

---

## 12. The JWT Strategy

```typescript
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService, private readonly usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),  // read from Authorization header
      secretOrKey: config.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.usersService.findById(payload.sub);  // payload.sub = user ID
    if (!user || !user.isActive) throw new UnauthorizedException();
    return user;   // this becomes req.user in the controller
  }
}
```

### How Passport works

Passport is an authentication middleware library. A "strategy" tells Passport how to authenticate a request.

The JWT strategy:
1. Extracts the Bearer token from the Authorization header
2. Verifies the signature with `JWT_SECRET`
3. Decodes the payload
4. Calls `validate(payload)` — our custom function
5. Whatever `validate` returns gets attached to `req.user`

When we write `@UseGuards(JwtAuthGuard)` on a controller method, Passport runs this whole process automatically.

---

## 13. Guards and Decorators

### `JwtAuthGuard`

```typescript
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

This is just a NestJS guard that wraps the Passport 'jwt' strategy. When you put `@UseGuards(JwtAuthGuard)` on an endpoint, it:
1. Extracts the token
2. Validates it via `JwtStrategy`
3. If valid: continues to the controller method with `req.user` set
4. If invalid: returns 401 Unauthorized

### `RolesGuard`

```typescript
@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) return true;  // no @Roles() decorator = any role can access
    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.includes(user?.role);
  }
}
```

Used together with `@Roles(Role.HOSPITAL)`:

```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.HOSPITAL)
@Put('resources')
updateResources(@CurrentUser() user: UserEntity, @Body() dto: UpdateResourcesDto) { ... }
```

If a patient tries to call this endpoint:
1. `JwtAuthGuard` validates the token — passes (patient has valid token)
2. `RolesGuard` checks the role — fails (patient's role is not HOSPITAL)
3. Returns 403 Forbidden

### `@Roles()` decorator

```typescript
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
```

This is a **metadata decorator**. It attaches data to the function/class. `RolesGuard` reads this metadata using `Reflector` to know what roles are allowed.

`@Roles(Role.HOSPITAL, Role.PATIENT)` would allow both hospital admins and patients.

### `@CurrentUser()` decorator

```typescript
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UserEntity => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
```

This is a **parameter decorator** — it extracts something from the request and injects it as a function parameter.

Instead of writing:
```typescript
someMethod(@Req() req: Request) {
  const user = req.user as UserEntity;
  // use user...
}
```

You write:
```typescript
someMethod(@CurrentUser() user: UserEntity) {
  // user is already typed and extracted
}
```

Cleaner, typed, reusable.

---

## 14. The Auth Service

### `register`

```typescript
async register(dto: RegisterDto): Promise<AuthResponseDto> {
  // 1. Check if email already exists
  const existing = await this.usersService.findByEmail(dto.email);
  if (existing) throw new ConflictException('Email already registered');

  // 2. Hash the password (NEVER store plain text)
  const passwordHash = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);

  // 3. Save user to database
  const user = await this.usersService.save({ name, email, passwordHash, role });

  // 4. Generate 15-minute access token
  const accessToken = this.generateAccessToken(user.id, user.email, user.role);

  // 5. Create 7-day refresh token in database
  await this.createRefreshToken(user.id);

  // 6. Return — only safe fields (never return passwordHash)
  return { accessToken, user: { id, name, email, role } };
}
```

### `login`

```typescript
async login(dto: LoginDto): Promise<AuthResponseDto & { refreshToken: string }> {
  const user = await this.usersService.findByEmail(dto.email);

  // Note: SAME error for "user not found" and "wrong password"
  // This prevents email enumeration ("that email isn't registered" tells attackers too much)
  if (!user || !user.isActive) throw new UnauthorizedException('Invalid credentials');

  const valid = await bcrypt.compare(dto.password, user.passwordHash);
  if (!valid) throw new UnauthorizedException('Invalid credentials');

  // Revoke all existing tokens for this user (security: prevent token accumulation)
  await this.refreshTokenRepo.update({ userId: user.id, isRevoked: false }, { isRevoked: true });

  const accessToken = this.generateAccessToken(user.id, user.email, user.role);
  const newToken = await this.createRefreshToken(user.id);

  return { accessToken, refreshToken: newToken.token, user: { id, name, email, role } };
}
```

### `refresh`

```typescript
async refresh(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
  // Find the token in DB — must not be revoked
  const token = await this.refreshTokenRepo.findOne({
    where: { token: refreshToken, isRevoked: false },
    relations: ['user'],   // also load the user
  });

  // Fail if: not found, expired, or user deactivated
  if (!token || token.expiresAt < new Date()) throw new UnauthorizedException('...');
  if (!token.user || !token.user.isActive) throw new UnauthorizedException('Account deactivated');

  // Rotate: revoke old token, create new one
  await this.refreshTokenRepo.update(token.id, { isRevoked: true });
  const newRefreshToken = await this.createRefreshToken(token.user.id);

  const accessToken = this.generateAccessToken(token.user.id, token.user.email, token.user.role);

  return { accessToken, refreshToken: newRefreshToken.token };
}
```

**Token rotation** is important. Each time you refresh, the old token is invalidated and a new one is issued. If someone steals a refresh token, using it to get a new access token immediately makes the old token invalid. The legitimate user's next refresh will fail (old token revoked) and they'll be forced to log in again. This detects and limits the damage of a stolen token.

---

## 15. Security Decisions in Depth

### Why identical error messages for "email not found" vs "wrong password"?

```typescript
if (!user || !user.isActive) throw new UnauthorizedException('Invalid credentials');
const valid = await bcrypt.compare(dto.password, user.passwordHash);
if (!valid) throw new UnauthorizedException('Invalid credentials');
```

Both say "Invalid credentials." If we said "Email not found" for the first case, an attacker could iterate through email addresses to find valid accounts (**email enumeration**). With identical messages, they get no information.

### Why validate `isActive` in both `login` AND `refresh`?

```typescript
// In login:
if (!user || !user.isActive) throw new UnauthorizedException('Invalid credentials');

// In refresh:
if (!token.user || !token.user.isActive) throw new UnauthorizedException('Account deactivated');

// In JwtStrategy.validate():
if (!user || !user.isActive) throw new UnauthorizedException();
```

If an admin deactivates a user account, we need to block them immediately:
- `JwtStrategy` blocks them on the next API call after their access token expires (within 15 minutes)
- `refresh()` blocks them from getting a new access token
- `login()` blocks them from getting any token at all

Without the check in `refresh()`, a deactivated user could keep calling refresh for up to 7 days and keep getting valid 15-minute access tokens.

### Why guard `JWT_SECRET` at constructor startup?

```typescript
constructor(...) {
  const secret = this.config.get<string>('JWT_SECRET');
  if (!secret) throw new Error('JWT_SECRET environment variable is not configured');
  this.jwtSecret = secret;
}
```

If `JWT_SECRET` is missing and we don't guard it, `jwtService.sign(payload, { secret: undefined })` creates tokens signed with `undefined` as the key. These tokens are **still valid** (JWT library accepts them) — any server with a missing `JWT_SECRET` would accept them. This is a critical security hole.

The guard makes the server crash immediately on startup if the secret is missing. Fail fast and loudly is safer than silently misconfigured.

### Why revoke all tokens on login?

```typescript
await this.refreshTokenRepo.update({ userId: user.id, isRevoked: false }, { isRevoked: true });
```

Every time a user logs in, all their existing refresh tokens are revoked. This means:
- If a user changes their password and logs in again, all old sessions are terminated
- Tokens don't accumulate in the database over years of use
- A stolen token is invalidated the next time the real user logs in

### `clearCookie` must match the original cookie options

```typescript
res.clearCookie('refreshToken', {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/',
});
```

When a browser receives `Set-Cookie: refreshToken=; Max-Age=0`, it only deletes the cookie if the `path`, `domain`, `secure`, and `sameSite` values match the original cookie. If they don't match, the browser ignores the delete instruction and the old cookie remains.

---

## 16. The Auth Controller

### Why strip the refresh token from the login response?

```typescript
async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
  const result = await this.authService.login(dto);

  // Set refresh token as httpOnly cookie — JavaScript CANNOT read this
  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,  // 7 days in milliseconds
  });

  // Strip it from the JSON response — never expose in body
  const { refreshToken: _, ...response } = result;
  return response;  // only { accessToken, user } in the body
}
```

The refresh token is sent only in the cookie — never in the response body. Why?

- If it were in the body, the frontend would save it somewhere (localStorage) where XSS attacks could steal it
- The httpOnly cookie is sent automatically by the browser on every request to your domain, but JavaScript code cannot access it via `document.cookie`

The access token IS in the response body (short-lived, 15 minutes, used immediately in headers).

### `@Res({ passthrough: true })`

```typescript
async login(@Res({ passthrough: true }) res: Response) {
```

Normally `@Res()` switches NestJS into "manual response mode" — you'd have to call `res.json()` yourself. `passthrough: true` means: give me the response object to set cookies, but still let NestJS handle sending the response normally. Best of both worlds.

---

## 17. How Everything Wires Together

```
AppModule
├── ConfigModule (global: reads .env file)
├── ThrottlerModule (rate limiting: 100 req/min)
├── APP_GUARD → ThrottlerGuard (enforces rate limit on every route)
├── DatabaseModule
│   └── TypeOrmModule.forRootAsync → connects to PostgreSQL
├── UsersModule
│   ├── TypeOrmModule.forFeature([UserEntity]) → creates UserRepository
│   └── UsersService (findByEmail, findById, save)
├── AuthModule
│   ├── imports UsersModule (for UsersService)
│   ├── PassportModule (Passport.js integration)
│   ├── JwtModule.register({}) (JwtService with no default secret)
│   ├── TypeOrmModule.forFeature([RefreshTokenEntity])
│   ├── AuthService (register, login, refresh, logout)
│   ├── JwtStrategy (validates Bearer tokens on every protected request)
│   └── AuthController (POST /register, /login, /refresh, /logout, GET /me)
└── HealthModule
    └── HealthController (GET /health)
```

### The request lifecycle for a protected endpoint

```
POST /api/v1/auth/me (with Authorization: Bearer <token>)
    ↓
ThrottlerGuard: is this IP within rate limit? → yes
    ↓
JwtAuthGuard: is the Bearer token valid?
    → JwtStrategy extracts token from header
    → Verifies signature with JWT_SECRET
    → Decodes payload: { sub: "uuid-1", email: "amit@x.com", role: "patient" }
    → UsersService.findById("uuid-1") → finds user in DB
    → user.isActive = true → passes
    → attaches user to req.user
    ↓
ValidationPipe: validate request body (none for GET, skipped)
    ↓
AuthController.getMe(@CurrentUser() user) → returns req.user
    ↓
ResponseInterceptor: wraps result in { success: true, data: <user>, timestamp: ... }
    ↓
Response: { "success": true, "data": { "id": "uuid-1", "name": "Amit", ... } }
```

---

## 18. TDD — Test-Driven Development

For every service in this plan, we followed TDD:

1. **Write the test first** (Red) — run it, watch it fail because the code doesn't exist yet
2. **Write the minimal code to make it pass** (Green) — implement the function
3. **Review and clean up** (Refactor) — the test stays green while you improve

### Why write tests before code?

- Forces you to think about the **interface** (what the function should do) before the **implementation** (how it does it)
- Gives you immediate feedback — if the test was hard to write, the code design might need rethinking
- Prevents over-engineering — you only write code that makes a test pass, nothing more

### Example: AuthService login test

```typescript
it('throws UnauthorizedException if password wrong', async () => {
  usersService.findByEmail.mockResolvedValue(mockUser as any);  // user exists
  await expect(service.login({ email: 'test@example.com', password: 'WrongPass1' }))
    .rejects.toThrow(UnauthorizedException);
});
```

This test doesn't test *how* the password is checked (it doesn't care if we use bcrypt or md5). It tests *the behavior*: if the password is wrong, throw `UnauthorizedException`. The implementation is free to change as long as this behavior holds.

### Mock vs real database

All our unit tests use **mocks** — fake versions of the database:

```typescript
{
  provide: getRepositoryToken(UserEntity),
  useValue: {
    findOne: jest.fn(),   // a function that records calls and returns what we tell it to
    save: jest.fn(),
  },
}
```

Why not use a real database? Unit tests should be:
- **Fast** — no database connection overhead
- **Isolated** — test exactly one thing without side effects
- **Deterministic** — same input → same output, regardless of what's in the DB

Plan 3 will have integration tests that use a real PostgreSQL database.

---

## 19. Complete File List

Every file created or modified in Plan 2:

```
apps/api/src/
├── app.module.ts                          ← Updated: added DatabaseModule, UsersModule, AuthModule
├── main.ts                                ← Updated: added global filter and interceptor
│
├── database/
│   ├── data-source.ts                     ← TypeORM CLI config (for migrations)
│   ├── database.module.ts                 ← NestJS runtime TypeORM config
│   ├── migrations/
│   │   └── .gitkeep                       ← Empty placeholder (migrations added later)
│   └── entities/
│       ├── index.ts                       ← Barrel export for all entities
│       ├── user.entity.ts                 ← users table
│       ├── hospital.entity.ts             ← hospitals table
│       ├── blood-donor.entity.ts          ← blood_donors table
│       ├── ambulance-driver.entity.ts     ← ambulance_drivers table
│       ├── doctor.entity.ts               ← doctors table
│       ├── emergency-request.entity.ts    ← emergency_requests table
│       ├── blood-request.entity.ts        ← blood_requests table
│       ├── booking.entity.ts              ← bookings table
│       ├── prescription.entity.ts         ← prescriptions table
│       ├── notification.entity.ts         ← notifications table
│       └── refresh-token.entity.ts        ← refresh_tokens table
│
├── common/
│   ├── filters/
│   │   └── http-exception.filter.ts       ← All errors → { success: false, ... }
│   └── interceptors/
│       └── response.interceptor.ts        ← All success → { success: true, data, ... }
│
├── users/
│   ├── users.module.ts                    ← Exports UsersService
│   ├── users.service.ts                   ← findByEmail, findById, save
│   └── users.service.spec.ts              ← 3 unit tests
│
└── auth/
    ├── auth.module.ts                     ← Wires all auth pieces together
    ├── auth.controller.ts                 ← POST /register, /login, /refresh, /logout, GET /me
    ├── auth.controller.spec.ts            ← 3 unit tests
    ├── auth.service.ts                    ← Core auth logic
    ├── auth.service.spec.ts               ← 11 unit tests
    ├── dto/
    │   ├── register.dto.ts                ← Validates register request body
    │   ├── login.dto.ts                   ← Validates login request body
    │   └── auth-response.dto.ts           ← Shape of auth responses
    ├── strategies/
    │   └── jwt.strategy.ts                ← Validates Bearer tokens on every request
    ├── guards/
    │   ├── jwt-auth.guard.ts              ← @UseGuards(JwtAuthGuard) — require login
    │   └── roles.guard.ts                 ← @UseGuards(RolesGuard) — require specific role
    └── decorators/
        ├── roles.decorator.ts             ← @Roles(Role.HOSPITAL) — declare allowed roles
        └── current-user.decorator.ts      ← @CurrentUser() — inject logged-in user
```

---

## 20. What the API Looks Like Now

After Plan 2, these endpoints work:

### `POST /api/v1/auth/register`
**Request:**
```json
{
  "name": "Amit Sharma",
  "email": "amit@example.com",
  "password": "Test@12345",
  "role": "patient"
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGci...",
    "user": { "id": "uuid-1", "name": "Amit Sharma", "email": "amit@example.com", "role": "patient" }
  },
  "timestamp": "2026-07-06T..."
}
```
Also sets `refreshToken` httpOnly cookie.

### `POST /api/v1/auth/login`
Same as register response. Validates email + password.

### `POST /api/v1/auth/refresh`
No body needed — reads refresh cookie automatically.
**Response:** `{ "success": true, "data": { "accessToken": "new_token..." } }`
Also rotates the refresh cookie.

### `POST /api/v1/auth/logout`
Requires: `Authorization: Bearer <token>`
Revokes refresh token in DB. Clears cookie. Returns 204 No Content.

### `GET /api/v1/auth/me`
Requires: `Authorization: Bearer <token>`
**Response:**
```json
{
  "success": true,
  "data": { "id": "uuid-1", "name": "Amit Sharma", "email": "amit@example.com", "role": "patient", "isActive": true, ... }
}
```

### Error example
```json
{
  "success": false,
  "statusCode": 401,
  "message": "Invalid credentials",
  "path": "/api/v1/auth/login",
  "timestamp": "2026-07-06T..."
}
```

---

## 21. What Comes Next

Plan 3 builds all the **feature modules** on top of the foundation we just created:

- **Hospitals** — list nearby hospitals, search by city, update ICU beds, manage resources
- **Doctors** — add/edit/remove doctors per hospital
- **Emergency** — SOS requests, hospital accept/reject, ambulance dispatch
- **Blood** — donor search, blood requests, availability toggle
- **Bookings** — doctor and ICU appointment scheduling
- **Prescriptions** — issue and view prescriptions
- **Ambulance** — driver duty toggle, live GPS location sharing
- **Notifications** — in-app notification system
- **Socket.IO Gateway** — real-time events (emergency alerts, blood request broadcasts, live ambulance tracking)

Every feature module will:
- Import the relevant entities
- Have a service with business logic (unit-tested)
- Have a controller with REST endpoints protected by `@UseGuards(JwtAuthGuard, RolesGuard)`
- Use `@Roles(Role.PATIENT)` / `@Roles(Role.HOSPITAL)` etc. to restrict access
- Use `@CurrentUser()` to know who is making the request
