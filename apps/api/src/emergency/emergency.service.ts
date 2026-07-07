import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmergencyRequestEntity } from '../database/entities/emergency-request.entity';
import { CreateEmergencyDto } from './dto/create-emergency.dto';
import { EmergencyStatus } from '@medlink/shared';

@Injectable()
export class EmergencyService {
  constructor(
    @InjectRepository(EmergencyRequestEntity)
    private readonly emergencyRepo: Repository<EmergencyRequestEntity>,
  ) {}

  create(patientId: string, dto: CreateEmergencyDto): Promise<EmergencyRequestEntity> {
    return this.emergencyRepo.save({ patientId, ...dto, status: EmergencyStatus.PENDING });
  }

  findPending(): Promise<EmergencyRequestEntity[]> {
    return this.emergencyRepo.find({
      where: { status: EmergencyStatus.PENDING },
      relations: ['patient'],
      order: { createdAt: 'DESC' },
    });
  }

  findByPatient(patientId: string): Promise<EmergencyRequestEntity[]> {
    return this.emergencyRepo.find({
      where: { patientId },
      order: { createdAt: 'DESC' },
    });
  }

  async accept(id: string, hospitalId: string): Promise<EmergencyRequestEntity> {
    const request = await this.findById(id);
    request.status = EmergencyStatus.ACCEPTED;
    request.hospitalId = hospitalId;
    return this.emergencyRepo.save(request);
  }

  async reject(id: string): Promise<EmergencyRequestEntity> {
    const request = await this.findById(id);
    request.status = EmergencyStatus.REJECTED;
    return this.emergencyRepo.save(request);
  }

  async cancel(id: string, patientId: string): Promise<EmergencyRequestEntity> {
    const request = await this.findById(id);
    if (request.patientId !== patientId) throw new ForbiddenException();
    request.status = EmergencyStatus.CANCELLED;
    return this.emergencyRepo.save(request);
  }

  async resolve(id: string): Promise<EmergencyRequestEntity> {
    const request = await this.findById(id);
    request.status = EmergencyStatus.RESOLVED;
    request.resolvedAt = new Date();
    return this.emergencyRepo.save(request);
  }

  async findById(id: string): Promise<EmergencyRequestEntity> {
    const r = await this.emergencyRepo.findOne({ where: { id }, relations: ['patient', 'hospital'] });
    if (!r) throw new NotFoundException(`Emergency request ${id} not found`);
    return r;
  }
}
