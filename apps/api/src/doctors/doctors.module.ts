import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DoctorEntity } from '../database/entities/doctor.entity';
import { DoctorsService } from './doctors.service';
import { DoctorsController } from './doctors.controller';
import { HospitalsModule } from '../hospitals/hospitals.module';

@Module({
  imports: [TypeOrmModule.forFeature([DoctorEntity]), HospitalsModule],
  providers: [DoctorsService],
  controllers: [DoctorsController],
  exports: [DoctorsService],
})
export class DoctorsModule {}
