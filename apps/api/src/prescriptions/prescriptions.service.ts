import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PrescriptionEntity } from '../database/entities/prescription.entity';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { UserEntity } from '../database/entities/user.entity';
import { Role } from '@medlink/shared';

@Injectable()
export class PrescriptionsService {
  constructor(
    @InjectRepository(PrescriptionEntity)
    private readonly prescriptionRepo: Repository<PrescriptionEntity>,
  ) {}

  async create(hospitalUserId: string, dto: CreatePrescriptionDto): Promise<PrescriptionEntity> {
    const prescription = this.prescriptionRepo.create(dto);
    const saved = await this.prescriptionRepo.save(prescription);

    const authorized = await this.prescriptionRepo
      .createQueryBuilder('p')
      .innerJoin('p.doctor', 'd')
      .innerJoin('d.hospital', 'h')
      .where('p.id = :id', { id: saved.id })
      .andWhere('h.user_id = :hospitalUserId', { hospitalUserId })
      .getExists();

    if (!authorized) {
      await this.prescriptionRepo.delete(saved.id);
      throw new ForbiddenException('Hospital is not authorized to create this prescription');
    }

    return saved;
  }

  findByPatient(patientId: string): Promise<PrescriptionEntity[]> {
    return this.prescriptionRepo.find({
      where: { patientId },
      relations: ['doctor'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByIdForUser(id: string, user: UserEntity): Promise<PrescriptionEntity> {
    const query = this.prescriptionRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.patient', 'patient')
      .leftJoinAndSelect('p.doctor', 'doctor')
      .leftJoinAndSelect('doctor.hospital', 'hospital')
      .where('p.id = :id', { id });

    if (user.role === Role.PATIENT) {
      query.andWhere('p.patient_id = :userId', { userId: user.id });
    } else if (user.role === Role.HOSPITAL) {
      query.andWhere('hospital.user_id = :userId', { userId: user.id });
    } else {
      throw new ForbiddenException('You are not authorized to access this prescription');
    }

    const prescription = await query.getOne();
    if (!prescription) throw new NotFoundException(`Prescription ${id} not found`);
    return prescription;
  }
}
