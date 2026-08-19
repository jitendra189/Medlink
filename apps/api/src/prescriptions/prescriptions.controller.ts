import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PrescriptionsService } from './prescriptions.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserEntity } from '../database/entities/user.entity';
import { Role } from '@medlink/shared';

@ApiTags('prescriptions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('prescriptions')
export class PrescriptionsController {
  constructor(private readonly prescriptionsService: PrescriptionsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.HOSPITAL)
  @ApiOperation({ summary: 'Create a prescription for a patient' })
  create(@Body() dto: CreatePrescriptionDto, @CurrentUser() user: UserEntity) {
    return this.prescriptionsService.create(user.id, dto);
  }

  @Get('my')
  @UseGuards(RolesGuard)
  @Roles(Role.PATIENT)
  @ApiOperation({ summary: "Get patient's prescription history" })
  getMyPrescriptions(@CurrentUser() user: UserEntity) {
    return this.prescriptionsService.findByPatient(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get prescription by ID' })
  findById(@Param('id') id: string, @CurrentUser() user: UserEntity) {
    return this.prescriptionsService.findByIdForUser(id, user);
  }
}
