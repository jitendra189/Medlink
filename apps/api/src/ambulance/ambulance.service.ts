import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AmbulanceDriverEntity } from '../database/entities/ambulance-driver.entity';
import { UpdateLocationDto } from './dto/update-location.dto';
import { DEFAULT_SEARCH_RADIUS_KM } from '@medlink/shared';

@Injectable()
export class AmbulanceService {
  constructor(
    @InjectRepository(AmbulanceDriverEntity)
    private readonly driverRepo: Repository<AmbulanceDriverEntity>,
  ) {}

  async toggleDuty(userId: string): Promise<AmbulanceDriverEntity> {
    const driver = await this.driverRepo.findOne({ where: { userId } });
    if (!driver) throw new NotFoundException('Driver profile not found');
    driver.isOnDuty = !driver.isOnDuty;
    return this.driverRepo.save(driver);
  }

  async updateLocation(userId: string, dto: UpdateLocationDto): Promise<AmbulanceDriverEntity> {
    const driver = await this.driverRepo.findOne({ where: { userId } });
    if (!driver) throw new NotFoundException('Driver profile not found');
    driver.latitude = dto.latitude;
    driver.longitude = dto.longitude;
    driver.lastLocationAt = new Date();
    return this.driverRepo.save(driver);
  }

  async getNearbyRequests(userId: string, radiusKm = DEFAULT_SEARCH_RADIUS_KM) {
    const driver = await this.driverRepo.findOne({ where: { userId } });
    if (!driver) throw new NotFoundException('Driver profile not found');
    return { driverId: driver.id, latitude: driver.latitude, longitude: driver.longitude };
  }

  async getDriverLocation(driverId: string): Promise<{ latitude: number; longitude: number; lastLocationAt: Date }> {
    const driver = await this.driverRepo.findOne({ where: { id: driverId } });
    if (!driver) throw new NotFoundException(`Driver ${driverId} not found`);
    return { latitude: driver.latitude, longitude: driver.longitude, lastLocationAt: driver.lastLocationAt };
  }
}
