import { Controller, Post, Get, Put, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EmergencyService } from './emergency.service';
import { CreateEmergencyDto } from './dto/create-emergency.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserEntity } from '../database/entities/user.entity';
import { HospitalsService } from '../hospitals/hospitals.service';
import { Role } from '@medlink/shared';

@ApiTags('emergency')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('emergency')
export class EmergencyController {
  constructor(
    private readonly emergencyService: EmergencyService,
    private readonly hospitalsService: HospitalsService,
  ) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.PATIENT)
  @ApiOperation({ summary: 'Create emergency (SOS) request' })
  create(@CurrentUser() user: UserEntity, @Body() dto: CreateEmergencyDto) {
    return this.emergencyService.create(user.id, dto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.HOSPITAL)
  @ApiOperation({ summary: 'Get pending emergency requests (hospital view)' })
  findPending() {
    return this.emergencyService.findPending();
  }

  @Get('my')
  @UseGuards(RolesGuard)
  @Roles(Role.PATIENT)
  @ApiOperation({ summary: "Get patient's emergency request history" })
  findMine(@CurrentUser() user: UserEntity) {
    return this.emergencyService.findByPatient(user.id);
  }

  @Put(':id/accept')
  @UseGuards(RolesGuard)
  @Roles(Role.HOSPITAL)
  @ApiOperation({ summary: 'Accept an emergency request' })
  async accept(@CurrentUser() user: UserEntity, @Param('id') id: string) {
    const hospital = await this.hospitalsService.findByUserId(user.id);
    return this.emergencyService.accept(id, hospital.id);
  }

  @Put(':id/reject')
  @UseGuards(RolesGuard)
  @Roles(Role.HOSPITAL)
  @ApiOperation({ summary: 'Reject an emergency request' })
  async reject(@CurrentUser() user: UserEntity, @Param('id') id: string) {
    const hospital = await this.hospitalsService.findByUserId(user.id);
    return this.emergencyService.reject(id, hospital.id);
  }

  @Put(':id/cancel')
  @UseGuards(RolesGuard)
  @Roles(Role.PATIENT)
  @ApiOperation({ summary: 'Cancel an emergency request' })
  cancel(@CurrentUser() user: UserEntity, @Param('id') id: string) {
    return this.emergencyService.cancel(id, user.id);
  }

  @Put(':id/resolve')
  @UseGuards(RolesGuard)
  @Roles(Role.HOSPITAL)
  @ApiOperation({ summary: 'Mark emergency as resolved' })
  async resolve(@CurrentUser() user: UserEntity, @Param('id') id: string) {
    const hospital = await this.hospitalsService.findByUserId(user.id);
    return this.emergencyService.resolve(id, hospital.id);
  }
}
