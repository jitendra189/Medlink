import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { BloodGroup, BloodRequestStatus, BloodRequestUrgency } from '@medlink/shared';
import { UserEntity } from './user.entity';
import { BloodDonorEntity } from './blood-donor.entity';
import { HospitalEntity } from './hospital.entity';

@Entity('blood_requests')
export class BloodRequestEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'patient_id' })
  patientId!: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'patient_id' })
  patient!: UserEntity;

  @Column({ name: 'donor_id', nullable: true })
  donorId!: string;

  @ManyToOne(() => BloodDonorEntity, { nullable: true })
  @JoinColumn({ name: 'donor_id' })
  donor!: BloodDonorEntity;

  @Column({ name: 'hospital_id', nullable: true })
  hospitalId!: string;

  @ManyToOne(() => HospitalEntity, { nullable: true })
  @JoinColumn({ name: 'hospital_id' })
  hospital!: HospitalEntity;

  @Column({ name: 'blood_group', type: 'enum', enum: BloodGroup })
  bloodGroup!: BloodGroup;

  @Column({ type: 'enum', enum: BloodRequestStatus, default: BloodRequestStatus.PENDING })
  status!: BloodRequestStatus;

  @Column({ name: 'units_required', default: 1 })
  unitsRequired!: number;

  @Column({ type: 'enum', enum: BloodRequestUrgency, default: BloodRequestUrgency.MEDIUM })
  urgency!: BloodRequestUrgency;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
