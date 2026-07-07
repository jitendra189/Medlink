import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DoctorEntity } from '../database/entities/doctor.entity';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';

@Injectable()
export class DoctorsService {
  constructor(
    @InjectRepository(DoctorEntity)
    private readonly doctorRepo: Repository<DoctorEntity>,
  ) {}

  create(hospitalId: string, dto: CreateDoctorDto): Promise<DoctorEntity> {
    return this.doctorRepo.save({ hospitalId, ...dto });
  }

  findByHospital(hospitalId: string): Promise<DoctorEntity[]> {
    return this.doctorRepo.find({ where: { hospitalId } });
  }

  async update(id: string, hospitalId: string, dto: UpdateDoctorDto): Promise<DoctorEntity> {
    const doctor = await this.doctorRepo.findOne({ where: { id } });
    if (!doctor) throw new NotFoundException(`Doctor ${id} not found`);
    if (doctor.hospitalId !== hospitalId) throw new ForbiddenException();
    Object.assign(doctor, dto);
    return this.doctorRepo.save(doctor);
  }

  async remove(id: string, hospitalId: string): Promise<void> {
    const doctor = await this.doctorRepo.findOne({ where: { id } });
    if (!doctor) throw new NotFoundException(`Doctor ${id} not found`);
    if (doctor.hospitalId !== hospitalId) throw new ForbiddenException();
    await this.doctorRepo.delete(id);
  }
}
