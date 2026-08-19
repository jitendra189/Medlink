import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { DatabaseModule } from './database/database.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { HospitalsModule } from './hospitals/hospitals.module';
import { DoctorsModule } from './doctors/doctors.module';
import { EmergencyModule } from './emergency/emergency.module';
import { BloodModule } from './blood/blood.module';
import { BookingsModule } from './bookings/bookings.module';
import { PrescriptionsModule } from './prescriptions/prescriptions.module';
import { AmbulanceModule } from './ambulance/ambulance.module';
import { NotificationsModule } from './notifications/notifications.module';
import { GatewaysModule } from './gateways/gateways.module';
import { HealthModule } from './health/health.module';
import { UploadsModule } from './uploads/uploads.module';
import { THROTTLE_TTL_SECONDS, THROTTLE_LIMIT } from '@medlink/shared';

function validateEnvironment(env: Record<string, unknown>) {
  if (env.NODE_ENV !== 'production') return env;

  const hasDatabaseUrl = typeof env.DATABASE_URL === 'string' && env.DATABASE_URL.length > 0;
  const hasDiscreteDatabaseConfig = ['DATABASE_HOST', 'DATABASE_NAME', 'DATABASE_USER', 'DATABASE_PASSWORD']
    .every((key) => typeof env[key] === 'string' && env[key].length > 0);

  if (!hasDatabaseUrl && !hasDiscreteDatabaseConfig) {
    throw new Error('Production requires DATABASE_URL or DATABASE_HOST/DATABASE_NAME/DATABASE_USER/DATABASE_PASSWORD');
  }

  if (typeof env.JWT_SECRET !== 'string' || env.JWT_SECRET.length < 64) {
    throw new Error('Production JWT_SECRET must be at least 64 characters long');
  }

  if (typeof env.FRONTEND_URL !== 'string' || !/^https:\/\//.test(env.FRONTEND_URL)) {
    throw new Error('Production FRONTEND_URL must be an https URL');
  }

  return env;
}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnvironment }),
    ThrottlerModule.forRoot([{ ttl: THROTTLE_TTL_SECONDS * 1000, limit: THROTTLE_LIMIT }]),
    DatabaseModule,
    UsersModule,
    AuthModule,
    HospitalsModule,
    DoctorsModule,
    EmergencyModule,
    BloodModule,
    BookingsModule,
    PrescriptionsModule,
    AmbulanceModule,
    NotificationsModule,
    GatewaysModule,
    HealthModule,
    UploadsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
