import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserEntity } from '../database/entities/user.entity';
import { HospitalsService } from '../hospitals/hospitals.service';
import { BookingStatus, Role } from '@medlink/shared';

@ApiTags('bookings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('bookings')
export class BookingsController {
  constructor(
    private readonly bookingsService: BookingsService,
    private readonly hospitalsService: HospitalsService,
  ) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.PATIENT)
  @ApiOperation({ summary: 'Create a booking (doctor or ICU)' })
  create(@CurrentUser() user: UserEntity, @Body() dto: CreateBookingDto) {
    return this.bookingsService.create(user.id, dto);
  }

  @Get('my')
  @UseGuards(RolesGuard)
  @Roles(Role.PATIENT)
  @ApiOperation({ summary: "Get patient's booking history" })
  getMyBookings(@CurrentUser() user: UserEntity) {
    return this.bookingsService.findByPatient(user.id);
  }

  @Get('hospital')
  @UseGuards(RolesGuard)
  @Roles(Role.HOSPITAL)
  @ApiOperation({ summary: "Get hospital's incoming bookings" })
  async getHospitalBookings(@CurrentUser() user: UserEntity) {
    const hospital = await this.hospitalsService.findByUserId(user.id);
    return this.bookingsService.findByHospital(hospital.id);
  }

  @Put(':id/confirm')
  @UseGuards(RolesGuard)
  @Roles(Role.HOSPITAL)
  @ApiOperation({ summary: 'Confirm a booking' })
  confirm(@Param('id') id: string) {
    return this.bookingsService.updateStatus(id, BookingStatus.CONFIRMED);
  }

  @Put(':id/cancel')
  @ApiOperation({ summary: 'Cancel a booking' })
  cancel(@Param('id') id: string) {
    return this.bookingsService.updateStatus(id, BookingStatus.CANCELLED);
  }

  @Put(':id/complete')
  @UseGuards(RolesGuard)
  @Roles(Role.HOSPITAL)
  @ApiOperation({ summary: 'Mark booking as completed' })
  complete(@Param('id') id: string) {
    return this.bookingsService.updateStatus(id, BookingStatus.COMPLETED);
  }
}
