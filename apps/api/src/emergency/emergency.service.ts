import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
    const result = await this.emergencyRepo.update(
      { id, status: EmergencyStatus.PENDING },
      { status: EmergencyStatus.ACCEPTED, hospitalId },
    );

    if (!result.affected) {
      const request = await this.findById(id);
      throw new ConflictException(
        `Emergency request cannot be accepted from status ${request.status}`,
      );
    }

    return this.findById(id);
  }

  async reject(id: string): Promise<EmergencyRequestEntity> {
    const result = await this.emergencyRepo.update(
      { id, status: EmergencyStatus.PENDING },
      { status: EmergencyStatus.REJECTED },
    );

    if (!result.affected) {
      const request = await this.findById(id);
      throw new ConflictException(
        `Emergency request cannot be rejected from status ${request.status}`,
      );
    }

    return this.findById(id);
  }

  async cancel(id: string, patientId: string): Promise<EmergencyRequestEntity> {
    const request = await this.findById(id);
    if (request.patientId !== patientId) throw new ForbiddenException();

    if (![EmergencyStatus.PENDING, EmergencyStatus.ACCEPTED].includes(request.status)) {
      throw new ConflictException(
        `Emergency request cannot be cancelled from status ${request.status}`,
      );
    }

    request.status = EmergencyStatus.CANCELLED;
    return this.emergencyRepo.save(request);
  }

  async resolve(id: string): Promise<EmergencyRequestEntity> {
    const result = await this.emergencyRepo.update(
      { id, status: EmergencyStatus.ACCEPTED },
      { status: EmergencyStatus.RESOLVED, resolvedAt: new Date() },
    );

    if (!result.affected) {
      const request = await this.findById(id);
      throw new ConflictException(
        `Emergency request cannot be resolved from status ${request.status}`,
      );
    }

    return this.findById(id);
  }

  async findById(id: string): Promise<EmergencyRequestEntity> {
    const request = await this.emergencyRepo.findOne({
      where: { id },
      relations: ['patient', 'hospital', 'driver'],
    });
    if (!request) throw new NotFoundException(`Emergency request ${id} not found`);
    return request;
  }
}
