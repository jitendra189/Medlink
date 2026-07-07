import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, OneToOne, ManyToOne, JoinColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';
import { HospitalEntity } from './hospital.entity';

@Entity('ambulance_drivers')
export class AmbulanceDriverEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @OneToOne(() => UserEntity, (u) => u.ambulanceDriver)
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity;

  @Column({ type: 'varchar', name: 'hospital_id', nullable: true })
  hospitalId!: string | null;

  @ManyToOne(() => HospitalEntity, (h) => h.ambulanceDrivers, { nullable: true })
  @JoinColumn({ name: 'hospital_id' })
  hospital!: HospitalEntity | null;

  @Column({ type: 'varchar', name: 'vehicle_number', length: 20, nullable: true })
  vehicleNumber!: string | null;

  @Column({ name: 'is_on_duty', default: false })
  isOnDuty!: boolean;

  @Column({ type: 'decimal', precision: 9, scale: 6, nullable: true })
  latitude!: number;

  @Column({ type: 'decimal', precision: 9, scale: 6, nullable: true })
  longitude!: number;

  @Column({ name: 'last_location_at', nullable: true, type: 'timestamp' })
  lastLocationAt!: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
