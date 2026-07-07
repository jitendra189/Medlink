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
import { THROTTLE_TTL_SECONDS, THROTTLE_LIMIT } from '@medlink/shared';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
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
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
