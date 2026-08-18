import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AmbulanceDriverEntity } from '../database/entities/ambulance-driver.entity';
import { EmergencyRequestEntity } from '../database/entities/emergency-request.entity';
import { UserEntity } from '../database/entities/user.entity';
import { MedlinkGateway } from './medlink.gateway';

@Module({
  imports: [
    JwtModule.register({}),
    TypeOrmModule.forFeature([AmbulanceDriverEntity, EmergencyRequestEntity, UserEntity]),
  ],
  providers: [MedlinkGateway],
  exports: [MedlinkGateway],
})
export class GatewaysModule {}
