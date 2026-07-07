import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BloodDonorEntity } from '../database/entities/blood-donor.entity';
import { BloodRequestEntity } from '../database/entities/blood-request.entity';
import { BloodService } from './blood.service';
import { BloodController } from './blood.controller';

@Module({
  imports: [TypeOrmModule.forFeature([BloodDonorEntity, BloodRequestEntity])],
  providers: [BloodService],
  controllers: [BloodController],
  exports: [BloodService],
})
export class BloodModule {}
