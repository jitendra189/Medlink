import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmergencyRequestEntity } from '../database/entities/emergency-request.entity';
import { EmergencyService } from './emergency.service';
import { EmergencyController } from './emergency.controller';
import { HospitalsModule } from '../hospitals/hospitals.module';

@Module({
  imports: [TypeOrmModule.forFeature([EmergencyRequestEntity]), HospitalsModule],
  providers: [EmergencyService],
  controllers: [EmergencyController],
  exports: [EmergencyService],
})
export class EmergencyModule {}
