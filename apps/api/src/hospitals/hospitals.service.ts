import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HospitalEntity } from '../database/entities/hospital.entity';
import { HospitalFiltersDto } from './dto/hospital-filters.dto';
import { UpdateResourcesDto } from './dto/update-resources.dto';
import { DEFAULT_SEARCH_RADIUS_KM } from '@medlink/shared';

@Injectable()
export class HospitalsService {
  constructor(
    @InjectRepository(HospitalEntity)
    private readonly hospitalRepo: Repository<HospitalEntity>,
  ) {}

  findAll(filters: HospitalFiltersDto): Promise<HospitalEntity[]> {
    const qb = this.hospitalRepo.createQueryBuilder('h');
    if (filters.city) qb.andWhere('LOWER(h.city) = LOWER(:city)', { city: filters.city });
    if (filters.icuAvailable) qb.andWhere('h.icu_beds_available > 0');
    return qb.getMany();
  }

  findNearby(lat: number, lng: number, radiusKm = DEFAULT_SEARCH_RADIUS_KM): Promise<HospitalEntity[]> {
    return this.hospitalRepo
      .createQueryBuilder('h')
      .where(
        `(6371 * acos(cos(radians(:lat)) * cos(radians(h.latitude)) * cos(radians(h.longitude) - radians(:lng)) + sin(radians(:lat)) * sin(radians(h.latitude)))) < :radius`,
        { lat, lng, radius: radiusKm },
      )
      .orderBy(
        `(6371 * acos(cos(radians(${lat})) * cos(radians(h.latitude)) * cos(radians(h.longitude) - radians(${lng})) + sin(radians(${lat})) * sin(radians(h.latitude))))`,
        'ASC',
      )
      .getMany();
  }

  async findById(id: string): Promise<HospitalEntity> {
    const hospital = await this.hospitalRepo.findOne({ where: { id }, relations: ['doctors'] });
    if (!hospital) throw new NotFoundException(`Hospital ${id} not found`);
    return hospital;
  }

  async findByUserId(userId: string): Promise<HospitalEntity> {
    const hospital = await this.hospitalRepo.findOne({ where: { userId } });
    if (!hospital) throw new NotFoundException('Hospital profile not found');
    return hospital;
  }

  async updateResources(id: string, dto: UpdateResourcesDto): Promise<HospitalEntity> {
    const hospital = await this.findById(id);
    Object.assign(hospital, dto);
    return this.hospitalRepo.save(hospital);
  }

  getDashboardStats(hospitalId: string) {
    return this.hospitalRepo.findOne({ where: { id: hospitalId }, relations: ['doctors'] });
  }
}
