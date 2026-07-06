import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, OneToOne, JoinColumn,
} from 'typeorm';
import { BloodGroup } from '@medlink/shared';
import { UserEntity } from './user.entity';

@Entity('blood_donors')
export class BloodDonorEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @OneToOne(() => UserEntity, (u) => u.bloodDonor)
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity;

  @Column({ name: 'blood_group', type: 'enum', enum: BloodGroup })
  bloodGroup!: BloodGroup;

  @Column({ length: 100, nullable: true })
  city!: string;

  @Column({ type: 'decimal', precision: 9, scale: 6, nullable: true })
  latitude!: number;

  @Column({ type: 'decimal', precision: 9, scale: 6, nullable: true })
  longitude!: number;

  @Column({ name: 'is_available', default: true })
  isAvailable!: boolean;

  @Column({ name: 'last_donated_at', nullable: true, type: 'timestamp' })
  lastDonatedAt!: Date;

  @Column({ name: 'total_donations', default: 0 })
  totalDonations!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
