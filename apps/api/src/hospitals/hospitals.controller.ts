import { Controller, Get, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { HospitalsService } from './hospitals.service';
import { HospitalFiltersDto } from './dto/hospital-filters.dto';
import { UpdateResourcesDto } from './dto/update-resources.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserEntity } from '../database/entities/user.entity';
import { Role } from '@medlink/shared';

@ApiTags('hospitals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('hospitals')
export class HospitalsController {
  constructor(private readonly hospitalsService: HospitalsService) {}

  @Get()
  @ApiOperation({ summary: 'List hospitals with optional filters' })
  findAll(@Query() filters: HospitalFiltersDto) {
    return this.hospitalsService.findAll(filters);
  }

  @Get('nearby')
  @ApiOperation({ summary: 'Get hospitals within radius of a location' })
  findNearby(@Query('lat') lat: string, @Query('lng') lng: string, @Query('radiusKm') radiusKm?: string) {
    return this.hospitalsService.findNearby(parseFloat(lat), parseFloat(lng), radiusKm ? parseFloat(radiusKm) : undefined);
  }

  @Get('dashboard')
  @UseGuards(RolesGuard)
  @Roles(Role.HOSPITAL)
  @ApiOperation({ summary: 'Hospital admin dashboard stats' })
  getDashboard(@CurrentUser() user: UserEntity) {
    return this.hospitalsService.findByUserId(user.id);
  }

  @Put('resources')
  @UseGuards(RolesGuard)
  @Roles(Role.HOSPITAL)
  @ApiOperation({ summary: 'Update hospital resources' })
  async updateResources(@CurrentUser() user: UserEntity, @Body() dto: UpdateResourcesDto) {
    const hospital = await this.hospitalsService.findByUserId(user.id);
    return this.hospitalsService.updateResources(hospital.id, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get hospital by ID' })
  findById(@Param('id') id: string) {
    return this.hospitalsService.findById(id);
  }

  @Get(':id/doctors')
  @ApiOperation({ summary: 'Get doctors at a hospital' })
  async getDoctors(@Param('id') id: string) {
    const hospital = await this.hospitalsService.findById(id);
    return hospital.doctors;
  }

  @Get(':id/resources')
  @ApiOperation({ summary: 'Get resource availability for a hospital' })
  async getResources(@Param('id') id: string) {
    const h = await this.hospitalsService.findById(id);
    return {
      icuBedsTotal: h.icuBedsTotal,
      icuBedsAvailable: h.icuBedsAvailable,
      totalDoctors: h.totalDoctors,
      ambulancesTotal: h.ambulancesTotal,
      ambulancesAvailable: h.ambulancesAvailable,
    };
  }
}
