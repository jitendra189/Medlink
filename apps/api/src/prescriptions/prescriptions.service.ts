import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PrescriptionEntity } from '../database/entities/prescription.entity';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';

@Injectable()
export class PrescriptionsService {
  constructor(
    @InjectRepository(PrescriptionEntity)
    private readonly prescriptionRepo: Repository<PrescriptionEntity>,
  ) {}

  create(dto: CreatePrescriptionDto): Promise<PrescriptionEntity> {
    return this.prescriptionRepo.save(dto);
  }

  findByPatient(patientId: string): Promise<PrescriptionEntity[]> {
    return this.prescriptionRepo.find({ where: { patientId }, relations: ['doctor'], order: { createdAt: 'DESC' } });
  }

  async findById(id: string): Promise<PrescriptionEntity> {
    const p = await this.prescriptionRepo.findOne({ where: { id }, relations: ['patient', 'doctor'] });
    if (!p) throw new NotFoundException(`Prescription ${id} not found`);
    return p;
  }
}
