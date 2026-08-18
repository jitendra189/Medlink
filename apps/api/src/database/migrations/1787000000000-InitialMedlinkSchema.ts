import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMedlinkSchema1787000000000 implements MigrationInterface {
  name = 'InitialMedlinkSchema1787000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    await queryRunner.query(`CREATE TYPE "users_role_enum" AS ENUM('patient','hospital','donor','driver')`);
    await queryRunner.query(`CREATE TYPE "blood_donors_blood_group_enum" AS ENUM('A+','A-','B+','B-','AB+','AB-','O+','O-')`);
    await queryRunner.query(`CREATE TYPE "emergency_requests_type_enum" AS ENUM('icu','ambulance','general')`);
    await queryRunner.query(`CREATE TYPE "emergency_requests_status_enum" AS ENUM('pending','accepted','rejected','cancelled','resolved')`);
    await queryRunner.query(`CREATE TYPE "blood_requests_blood_group_enum" AS ENUM('A+','A-','B+','B-','AB+','AB-','O+','O-')`);
    await queryRunner.query(`CREATE TYPE "blood_requests_status_enum" AS ENUM('pending','fulfilled','cancelled')`);
    await queryRunner.query(`CREATE TYPE "blood_requests_urgency_enum" AS ENUM('low','medium','critical')`);
    await queryRunner.query(`CREATE TYPE "bookings_type_enum" AS ENUM('doctor','icu')`);
    await queryRunner.query(`CREATE TYPE "bookings_status_enum" AS ENUM('pending','confirmed','cancelled','completed')`);
    await queryRunner.query(`CREATE TYPE "notifications_type_enum" AS ENUM('emergency','blood','booking','system')`);

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" varchar(100) NOT NULL,
        "email" varchar(255) NOT NULL,
        "password_hash" varchar NOT NULL,
        "role" "users_role_enum" NOT NULL,
        "phone" varchar(15),
        "avatar_url" varchar,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "hospitals" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "name" varchar(200) NOT NULL,
        "address" text,
        "city" varchar(100),
        "state" varchar(100),
        "phone" varchar(15),
        "latitude" numeric(9,6),
        "longitude" numeric(9,6),
        "icu_beds_total" integer NOT NULL DEFAULT 0,
        "icu_beds_available" integer NOT NULL DEFAULT 0,
        "total_doctors" integer NOT NULL DEFAULT 0,
        "ambulances_total" integer NOT NULL DEFAULT 0,
        "ambulances_available" integer NOT NULL DEFAULT 0,
        "rating" numeric(2,1) NOT NULL DEFAULT 4.0,
        "photo_url" varchar,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_hospitals_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_hospitals_user_id" UNIQUE ("user_id"),
        CONSTRAINT "FK_hospitals_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "blood_donors" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "blood_group" "blood_donors_blood_group_enum" NOT NULL,
        "city" varchar(100),
        "latitude" numeric(9,6),
        "longitude" numeric(9,6),
        "is_available" boolean NOT NULL DEFAULT true,
        "last_donated_at" TIMESTAMP,
        "total_donations" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_blood_donors_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_blood_donors_user_id" UNIQUE ("user_id"),
        CONSTRAINT "FK_blood_donors_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "ambulance_drivers" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "hospital_id" uuid,
        "vehicle_number" varchar(20),
        "is_on_duty" boolean NOT NULL DEFAULT false,
        "latitude" numeric(9,6),
        "longitude" numeric(9,6),
        "last_location_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ambulance_drivers_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_ambulance_drivers_user_id" UNIQUE ("user_id"),
        CONSTRAINT "FK_ambulance_drivers_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "FK_ambulance_drivers_hospital" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "doctors" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "hospital_id" uuid NOT NULL,
        "name" varchar(100) NOT NULL,
        "speciality" varchar(100),
        "phone" varchar(15),
        "is_available" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_doctors_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_doctors_hospital" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "emergency_requests" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "patient_id" uuid NOT NULL,
        "hospital_id" uuid,
        "driver_id" uuid,
        "type" "emergency_requests_type_enum" NOT NULL,
        "status" "emergency_requests_status_enum" NOT NULL DEFAULT 'pending',
        "patient_lat" numeric(9,6) NOT NULL,
        "patient_lng" numeric(9,6) NOT NULL,
        "description" text,
        "resolved_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_emergency_requests_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_emergency_requests_patient" FOREIGN KEY ("patient_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "FK_emergency_requests_hospital" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "FK_emergency_requests_driver" FOREIGN KEY ("driver_id") REFERENCES "ambulance_drivers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "blood_requests" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "patient_id" uuid NOT NULL,
        "donor_id" uuid,
        "hospital_id" uuid,
        "blood_group" "blood_requests_blood_group_enum" NOT NULL,
        "status" "blood_requests_status_enum" NOT NULL DEFAULT 'pending',
        "units_required" integer NOT NULL DEFAULT 1,
        "urgency" "blood_requests_urgency_enum" NOT NULL DEFAULT 'medium',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_blood_requests_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_blood_requests_patient" FOREIGN KEY ("patient_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "FK_blood_requests_donor" FOREIGN KEY ("donor_id") REFERENCES "blood_donors"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "FK_blood_requests_hospital" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "bookings" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "patient_id" uuid NOT NULL,
        "doctor_id" uuid NOT NULL,
        "hospital_id" uuid NOT NULL,
        "type" "bookings_type_enum" NOT NULL,
        "status" "bookings_status_enum" NOT NULL DEFAULT 'pending',
        "scheduled_at" TIMESTAMP NOT NULL,
        "notes" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_bookings_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_bookings_patient" FOREIGN KEY ("patient_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "FK_bookings_doctor" FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "FK_bookings_hospital" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "notifications" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "type" "notifications_type_enum" NOT NULL,
        "title" varchar(200),
        "message" text,
        "is_read" boolean NOT NULL DEFAULT false,
        "reference_id" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notifications_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_notifications_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "prescriptions" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "patient_id" uuid NOT NULL,
        "doctor_id" uuid NOT NULL,
        "booking_id" uuid,
        "diagnosis" text,
        "medications" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "notes" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_prescriptions_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_prescriptions_patient" FOREIGN KEY ("patient_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "FK_prescriptions_doctor" FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "FK_prescriptions_booking" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "refresh_tokens" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "token" varchar NOT NULL,
        "expires_at" TIMESTAMP NOT NULL,
        "is_revoked" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_refresh_tokens_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_refresh_tokens_token" UNIQUE ("token"),
        CONSTRAINT "FK_refresh_tokens_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "password_reset_tokens" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "token" varchar(255) NOT NULL,
        "expires_at" TIMESTAMP NOT NULL,
        "is_used" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_password_reset_tokens_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_password_reset_tokens_token" UNIQUE ("token"),
        CONSTRAINT "FK_password_reset_tokens_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_emergency_requests_patient_id" ON "emergency_requests" ("patient_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_emergency_requests_hospital_id_status" ON "emergency_requests" ("hospital_id", "status")`);
    await queryRunner.query(`CREATE INDEX "IDX_blood_requests_patient_id" ON "blood_requests" ("patient_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_blood_requests_hospital_id_status" ON "blood_requests" ("hospital_id", "status")`);
    await queryRunner.query(`CREATE INDEX "IDX_bookings_patient_id_scheduled_at" ON "bookings" ("patient_id", "scheduled_at")`);
    await queryRunner.query(`CREATE INDEX "IDX_notifications_user_id_created_at" ON "notifications" ("user_id", "created_at")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "password_reset_tokens"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "refresh_tokens"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "prescriptions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "notifications"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "bookings"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "blood_requests"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "emergency_requests"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "doctors"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "ambulance_drivers"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "blood_donors"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "hospitals"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);

    await queryRunner.query(`DROP TYPE IF EXISTS "notifications_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "bookings_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "bookings_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "blood_requests_urgency_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "blood_requests_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "blood_requests_blood_group_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "emergency_requests_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "emergency_requests_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "blood_donors_blood_group_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "users_role_enum"`);
  }
}
