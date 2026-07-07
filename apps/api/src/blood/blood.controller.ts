import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BloodService } from './blood.service';
import { CreateBloodRequestDto } from './dto/create-blood-request.dto';
import { SearchDonorsDto } from './dto/search-donors.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserEntity } from '../database/entities/user.entity';
import { Role } from '@medlink/shared';

@ApiTags('blood')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('blood')
export class BloodController {
  constructor(private readonly bloodService: BloodService) {}

  @Get('donors')
  @ApiOperation({ summary: 'Search available blood donors' })
  searchDonors(@Query() filters: SearchDonorsDto) {
    return this.bloodService.searchDonors(filters);
  }

  @Post('requests')
  @UseGuards(RolesGuard)
  @Roles(Role.PATIENT)
  @ApiOperation({ summary: 'Create a blood request' })
  createRequest(@CurrentUser() user: UserEntity, @Body() dto: CreateBloodRequestDto) {
    return this.bloodService.createRequest(user.id, dto);
  }

  @Get('requests/my')
  @UseGuards(RolesGuard)
  @Roles(Role.PATIENT)
  @ApiOperation({ summary: "Get patient's blood requests" })
  getMyRequests(@CurrentUser() user: UserEntity) {
    return this.bloodService.findPatientRequests(user.id);
  }

  @Get('requests/pending')
  @UseGuards(RolesGuard)
  @Roles(Role.DONOR)
  @ApiOperation({ summary: 'Get pending blood requests (donor view)' })
  getPendingRequests() {
    return this.bloodService.findPendingRequests();
  }

  @Put('requests/:id/fulfill')
  @UseGuards(RolesGuard)
  @Roles(Role.DONOR)
  @ApiOperation({ summary: 'Fulfill a blood request' })
  fulfill(@CurrentUser() user: UserEntity, @Param('id') id: string) {
    return this.bloodService.fulfill(id, user.id);
  }

  @Put('requests/:id/cancel')
  @UseGuards(RolesGuard)
  @Roles(Role.PATIENT)
  @ApiOperation({ summary: 'Cancel a blood request' })
  cancel(@Param('id') id: string) {
    return this.bloodService.cancel(id);
  }

  @Get('dashboard')
  @UseGuards(RolesGuard)
  @Roles(Role.DONOR)
  @ApiOperation({ summary: 'Donor dashboard stats' })
  getDashboard(@CurrentUser() user: UserEntity) {
    return this.bloodService.getDonorDashboard(user.id);
  }

  @Put('availability')
  @UseGuards(RolesGuard)
  @Roles(Role.DONOR)
  @ApiOperation({ summary: 'Toggle donor availability' })
  toggleAvailability(@CurrentUser() user: UserEntity) {
    return this.bloodService.toggleAvailability(user.id);
  }
}
