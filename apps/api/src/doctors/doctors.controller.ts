import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DoctorsService } from './doctors.service';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserEntity } from '../database/entities/user.entity';
import { HospitalsService } from '../hospitals/hospitals.service';
import { Role } from '@medlink/shared';

@ApiTags('doctors')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.HOSPITAL)
@Controller('doctors')
export class DoctorsController {
  constructor(
    private readonly doctorsService: DoctorsService,
    private readonly hospitalsService: HospitalsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Add doctor to hospital' })
  async create(@CurrentUser() user: UserEntity, @Body() dto: CreateDoctorDto) {
    const hospital = await this.hospitalsService.findByUserId(user.id);
    return this.doctorsService.create(hospital.id, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update doctor details' })
  async update(@CurrentUser() user: UserEntity, @Param('id') id: string, @Body() dto: UpdateDoctorDto) {
    const hospital = await this.hospitalsService.findByUserId(user.id);
    return this.doctorsService.update(id, hospital.id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove doctor from hospital' })
  async remove(@CurrentUser() user: UserEntity, @Param('id') id: string) {
    const hospital = await this.hospitalsService.findByUserId(user.id);
    return this.doctorsService.remove(id, hospital.id);
  }
}
