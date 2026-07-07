import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HospitalEntity } from '../database/entities/hospital.entity';
import { HospitalsService } from './hospitals.service';
import { HospitalsController } from './hospitals.controller';

@Module({
  imports: [TypeOrmModule.forFeature([HospitalEntity])],
  providers: [HospitalsService],
  controllers: [HospitalsController],
  exports: [HospitalsService],
})
export class HospitalsModule {}
