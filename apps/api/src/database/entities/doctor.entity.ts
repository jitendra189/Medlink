import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { HospitalEntity } from './hospital.entity';

@Entity('doctors')
export class DoctorEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'hospital_id' })
  hospitalId!: string;

  @ManyToOne(() => HospitalEntity, (h) => h.doctors)
  @JoinColumn({ name: 'hospital_id' })
  hospital!: HospitalEntity;

  @Column({ length: 100 })
  name!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  speciality!: string | null;

  @Column({ type: 'varchar', length: 15, nullable: true })
  phone!: string | null;

  @Column({ name: 'is_available', default: true })
  isAvailable!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
