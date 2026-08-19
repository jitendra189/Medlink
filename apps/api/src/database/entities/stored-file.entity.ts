import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, Index } from 'typeorm';

@Entity('stored_files')
@Index(['filename'], { unique: true })
@Index(['ownerUserId'])
@Index(['patientId'])
export class StoredFileEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 255 })
  filename!: string;

  @Column({ name: 'owner_user_id' })
  ownerUserId!: string;

  @Column({ name: 'patient_id', nullable: true })
  patientId!: string | null;

  @Column({ length: 32 })
  kind!: 'avatar' | 'prescription';

  @Column({ name: 'mime_type', length: 100 })
  mimeType!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
