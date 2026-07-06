import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';
import { DoctorEntity } from './doctor.entity';
import { BookingEntity } from './booking.entity';

@Entity('prescriptions')
export class PrescriptionEntity {
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

  @Column({ name: 'booking_id', nullable: true })
  bookingId!: string;

  @ManyToOne(() => BookingEntity, { nullable: true })
  @JoinColumn({ name: 'booking_id' })
  booking!: BookingEntity;

  @Column({ nullable: true, type: 'text' })
  diagnosis!: string;

  @Column({ type: 'jsonb', default: [] })
  medications!: Array<{ name: string; dose: string; frequency: string; duration: string }>;

  @Column({ nullable: true, type: 'text' })
  notes!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
