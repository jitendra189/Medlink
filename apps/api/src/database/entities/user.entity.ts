import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, OneToOne, OneToMany,
} from 'typeorm';
import { Role } from '@medlink/shared';
import { HospitalEntity } from './hospital.entity';
import { BloodDonorEntity } from './blood-donor.entity';
import { AmbulanceDriverEntity } from './ambulance-driver.entity';
import { RefreshTokenEntity } from './refresh-token.entity';
import { NotificationEntity } from './notification.entity';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 100 })
  name!: string;

  @Column({ length: 255, unique: true })
  email!: string;

  @Column({ name: 'password_hash' })
  passwordHash!: string;

  @Column({ type: 'enum', enum: Role })
  role!: Role;

  @Column({ length: 15, nullable: true })
  phone!: string;

  @Column({ name: 'avatar_url', nullable: true })
  avatarUrl!: string;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToOne(() => HospitalEntity, (h) => h.user)
  hospital!: HospitalEntity;

  @OneToOne(() => BloodDonorEntity, (d) => d.user)
  bloodDonor!: BloodDonorEntity;

  @OneToOne(() => AmbulanceDriverEntity, (d) => d.user)
  ambulanceDriver!: AmbulanceDriverEntity;

  @OneToMany(() => RefreshTokenEntity, (t) => t.user)
  refreshTokens!: RefreshTokenEntity[];

  @OneToMany(() => NotificationEntity, (n) => n.user)
  notifications!: NotificationEntity[];
}
