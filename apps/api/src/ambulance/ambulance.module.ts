import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AmbulanceDriverEntity } from '../database/entities/ambulance-driver.entity';
import { AmbulanceService } from './ambulance.service';
import { AmbulanceController } from './ambulance.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AmbulanceDriverEntity])],
  providers: [AmbulanceService],
  controllers: [AmbulanceController],
  exports: [AmbulanceService],
})
export class AmbulanceModule {}
