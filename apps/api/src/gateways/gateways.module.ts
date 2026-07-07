import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MedlinkGateway } from './medlink.gateway';

@Module({
  imports: [JwtModule.register({})],
  providers: [MedlinkGateway],
  exports: [MedlinkGateway],
})
export class GatewaysModule {}
