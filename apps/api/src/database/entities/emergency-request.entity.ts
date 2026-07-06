import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { EmergencyStatus, EmergencyType } from '@medlink/shared';
import { UserEntity } from './user.entity';
import { HospitalEntity } from './hospital.entity';
import { AmbulanceDriverEntity } from './ambulance-driver.entity';

@Entity('emergency_requests')
export class EmergencyRequestEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'patient_id' })
  patientId!: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'patient_id' })
  patient!: UserEntity;

  @Column({ name: 'hospital_id', nullable: true })
  hospitalId!: string;

  @ManyToOne(() => HospitalEntity, { nullable: true })
  @JoinColumn({ name: 'hospital_id' })
  hospital!: HospitalEntity;

  @Column({ name: 'driver_id', nullable: true })
  driverId!: string;

  @ManyToOne(() => AmbulanceDriverEntity, { nullable: true })
  @JoinColumn({ name: 'driver_id' })
  driver!: AmbulanceDriverEntity;

  @Column({ type: 'enum', enum: EmergencyType })
  type!: EmergencyType;

  @Column({ type: 'enum', enum: EmergencyStatus, default: EmergencyStatus.PENDING })
  status!: EmergencyStatus;

  @Column({ name: 'patient_lat', type: 'decimal', precision: 9, scale: 6 })
  patientLat!: number;

  @Column({ name: 'patient_lng', type: 'decimal', precision: 9, scale: 6 })
  patientLng!: number;

  @Column({ nullable: true, type: 'text' })
  description!: string;

  @Column({ name: 'resolved_at', nullable: true, type: 'timestamp' })
  resolvedAt!: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
