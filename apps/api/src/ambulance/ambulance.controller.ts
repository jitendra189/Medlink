import { Controller, Get, Put, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AmbulanceService } from './ambulance.service';
import { UpdateLocationDto } from './dto/update-location.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserEntity } from '../database/entities/user.entity';
import { Role } from '@medlink/shared';

@ApiTags('ambulance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ambulance')
export class AmbulanceController {
  constructor(private readonly ambulanceService: AmbulanceService) {}

  @Put('duty')
  @UseGuards(RolesGuard)
  @Roles(Role.DRIVER)
  @ApiOperation({ summary: 'Toggle on-duty status' })
  toggleDuty(@CurrentUser() user: UserEntity) {
    return this.ambulanceService.toggleDuty(user.id);
  }

  @Put('location')
  @UseGuards(RolesGuard)
  @Roles(Role.DRIVER)
  @ApiOperation({ summary: 'Update driver live location' })
  updateLocation(@CurrentUser() user: UserEntity, @Body() dto: UpdateLocationDto) {
    return this.ambulanceService.updateLocation(user.id, dto);
  }

  @Get('requests')
  @UseGuards(RolesGuard)
  @Roles(Role.DRIVER)
  @ApiOperation({ summary: 'Get pending emergency requests near driver' })
  getNearbyRequests(@CurrentUser() user: UserEntity) {
    return this.ambulanceService.getNearbyRequests(user.id);
  }

  @Get('track/:driverId')
  @ApiOperation({ summary: 'Get live driver location for patient tracking' })
  trackDriver(@Param('driverId') driverId: string) {
    return this.ambulanceService.getDriverLocation(driverId);
  }
}
