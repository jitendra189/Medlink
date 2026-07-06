import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { BookingStatus, BookingType } from '@medlink/shared';
import { UserEntity } from './user.entity';
import { DoctorEntity } from './doctor.entity';
import { HospitalEntity } from './hospital.entity';

@Entity('bookings')
export class BookingEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'patient_id' })
  patientId!: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'patient_id' })
  patient!: UserEntity;

  @Column({ name: 'doctor_id' })
  doctorId!: string;

  @ManyToOne(() => DoctorEntity)
  @JoinColumn({ name: 'doctor_id' })
  doctor!: DoctorEntity;

  @Column({ name: 'hospital_id' })
  hospitalId!: string;

  @ManyToOne(() => HospitalEntity)
  @JoinColumn({ name: 'hospital_id' })
  hospital!: HospitalEntity;

  @Column({ type: 'enum', enum: BookingType })
  type!: BookingType;

  @Column({ type: 'enum', enum: BookingStatus, default: BookingStatus.PENDING })
  status!: BookingStatus;

  @Column({ name: 'scheduled_at', type: 'timestamp' })
  scheduledAt!: Date;

  @Column({ nullable: true, type: 'text' })
  notes!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
