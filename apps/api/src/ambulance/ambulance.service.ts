import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AmbulanceDriverEntity } from '../database/entities/ambulance-driver.entity';
import { EmergencyRequestEntity } from '../database/entities/emergency-request.entity';
import { UpdateLocationDto } from './dto/update-location.dto';
import { DEFAULT_SEARCH_RADIUS_KM, EmergencyStatus, Role } from '@medlink/shared';
import { UserEntity } from '../database/entities/user.entity';

@Injectable()
export class AmbulanceService {
  constructor(
    @InjectRepository(AmbulanceDriverEntity)
    private readonly driverRepo: Repository<AmbulanceDriverEntity>,
    @InjectRepository(EmergencyRequestEntity)
    private readonly emergencyRepo: Repository<EmergencyRequestEntity>,
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

  async getDriverLocation(driverId: string, user: UserEntity): Promise<{ latitude: number; longitude: number; lastLocationAt: Date }> {
    const driver = await this.driverRepo.findOne({ where: { id: driverId } });
    if (!driver) throw new NotFoundException(`Driver ${driverId} not found`);

    const emergencyQuery = this.emergencyRepo
      .createQueryBuilder('e')
      .leftJoin('e.hospital', 'h')
      .where('e.driver_id = :driverId', { driverId })
      .andWhere('e.status = :status', { status: EmergencyStatus.ACCEPTED });

    if (user.role === Role.PATIENT) {
      emergencyQuery.andWhere('e.patient_id = :userId', { userId: user.id });
    } else if (user.role === Role.HOSPITAL) {
      emergencyQuery.andWhere('h.user_id = :userId', { userId: user.id });
    } else if (user.role === Role.DRIVER) {
      if (driver.userId !== user.id) throw new ForbiddenException('You are not authorized to view this driver location');
      return { latitude: driver.latitude, longitude: driver.longitude, lastLocationAt: driver.lastLocationAt };
    } else {
      throw new ForbiddenException('You are not authorized to view this driver location');
    }

    const authorized = await emergencyQuery.getExists();
    if (!authorized) throw new ForbiddenException('You are not authorized to view this driver location');

    return { latitude: driver.latitude, longitude: driver.longitude, lastLocationAt: driver.lastLocationAt };
  }
}
