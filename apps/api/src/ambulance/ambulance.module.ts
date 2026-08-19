import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AmbulanceDriverEntity } from '../database/entities/ambulance-driver.entity';
import { EmergencyRequestEntity } from '../database/entities/emergency-request.entity';
import { AmbulanceService } from './ambulance.service';
import { AmbulanceController } from './ambulance.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AmbulanceDriverEntity, EmergencyRequestEntity])],
  providers: [AmbulanceService],
  controllers: [AmbulanceController],
  exports: [AmbulanceService],
})
export class AmbulanceModule {}
