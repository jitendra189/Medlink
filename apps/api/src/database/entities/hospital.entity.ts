import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, OneToOne, JoinColumn, OneToMany,
} from 'typeorm';
import { UserEntity } from './user.entity';
import { DoctorEntity } from './doctor.entity';
import { AmbulanceDriverEntity } from './ambulance-driver.entity';

@Entity('hospitals')
export class HospitalEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @OneToOne(() => UserEntity, (u) => u.hospital)
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity;

  @Column({ length: 200 })
  name!: string;

  @Column({ nullable: true, type: 'text' })
  address!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  state!: string | null;

  @Column({ type: 'varchar', length: 15, nullable: true })
  phone!: string | null;

  @Column({ type: 'decimal', precision: 9, scale: 6, nullable: true })
  latitude!: number;

  @Column({ type: 'decimal', precision: 9, scale: 6, nullable: true })
  longitude!: number;

  @Column({ name: 'icu_beds_total', default: 0 })
  icuBedsTotal!: number;

  @Column({ name: 'icu_beds_available', default: 0 })
  icuBedsAvailable!: number;

  @Column({ name: 'total_doctors', default: 0 })
  totalDoctors!: number;

  @Column({ name: 'ambulances_total', default: 0 })
  ambulancesTotal!: number;

  @Column({ name: 'ambulances_available', default: 0 })
  ambulancesAvailable!: number;

  @Column({ type: 'decimal', precision: 2, scale: 1, default: 4.0 })
  rating!: number;

  @Column({ type: 'varchar', name: 'photo_url', nullable: true })
  photoUrl!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => DoctorEntity, (d) => d.hospital)
  doctors!: DoctorEntity[];

  @OneToMany(() => AmbulanceDriverEntity, (d) => d.hospital)
  ambulanceDrivers!: AmbulanceDriverEntity[];
}
