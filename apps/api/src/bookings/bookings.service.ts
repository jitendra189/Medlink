import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BookingEntity } from '../database/entities/booking.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { BookingStatus } from '@medlink/shared';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(BookingEntity)
    private readonly bookingRepo: Repository<BookingEntity>,
  ) {}

  create(patientId: string, dto: CreateBookingDto): Promise<BookingEntity> {
    return this.bookingRepo.save({ patientId, ...dto, scheduledAt: new Date(dto.scheduledAt), status: BookingStatus.PENDING });
  }

  findByPatient(patientId: string): Promise<BookingEntity[]> {
    return this.bookingRepo.find({ where: { patientId }, relations: ['doctor', 'hospital'], order: { scheduledAt: 'DESC' } });
  }

  findByHospital(hospitalId: string): Promise<BookingEntity[]> {
    return this.bookingRepo.find({ where: { hospitalId }, relations: ['patient', 'doctor'], order: { scheduledAt: 'ASC' } });
  }

  async updateStatus(id: string, status: BookingStatus): Promise<BookingEntity> {
    const booking = await this.bookingRepo.findOne({ where: { id } });
    if (!booking) throw new NotFoundException(`Booking ${id} not found`);
    booking.status = status;
    return this.bookingRepo.save(booking);
  }
}
