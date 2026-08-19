import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStoredFiles1788000000000 implements MigrationInterface {
  name = 'AddStoredFiles1788000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "stored_files" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "filename" varchar(255) NOT NULL,
        "owner_user_id" uuid NOT NULL,
        "patient_id" uuid,
        "kind" varchar(32) NOT NULL,
        "mime_type" varchar(100) NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_stored_files_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_stored_files_filename" UNIQUE ("filename"),
        CONSTRAINT "FK_stored_files_owner" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_stored_files_patient" FOREIGN KEY ("patient_id") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_stored_files_owner_user_id" ON "stored_files" ("owner_user_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_stored_files_patient_id" ON "stored_files" ("patient_id")`);

    await queryRunner.query(`
      INSERT INTO "stored_files" ("filename", "owner_user_id", "kind", "mime_type")
      SELECT
        substring("avatar_url" from '([^/]+)$'),
        "id",
        'avatar',
        CASE
          WHEN lower("avatar_url") LIKE '%.png' THEN 'image/png'
          WHEN lower("avatar_url") LIKE '%.gif' THEN 'image/gif'
          ELSE 'image/jpeg'
        END
      FROM "users"
      WHERE "avatar_url" IS NOT NULL
        AND "avatar_url" ~ '/api/v1/uploads/files/[^/]+'
        AND substring("avatar_url" from '([^/]+)$') IS NOT NULL
      ON CONFLICT ("filename") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_stored_files_patient_id"`);
    await queryRunner.query(`DROP INDEX "IDX_stored_files_owner_user_id"`);
    await queryRunner.query(`DROP TABLE "stored_files"`);
  }
}
