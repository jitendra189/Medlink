import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BookingsService } from './bookings.service';
import { BookingEntity } from '../database/entities/booking.entity';
import { BookingStatus, Role } from '@medlink/shared';

describe('BookingsService authorization', () => {
  let service: BookingsService;
  const booking = { id: 'b-1', patientId: 'patient-a', hospitalId: 'hospital-a', status: BookingStatus.PENDING } as BookingEntity;
  const repo = {
    findOne: jest.fn().mockResolvedValue(booking),
    save: jest.fn().mockImplementation((value) => Promise.resolve(value)),
  };

  beforeEach(async () => {
    repo.findOne.mockResolvedValue({ ...booking });
    const module = await Test.createTestingModule({
      providers: [
        BookingsService,
        { provide: getRepositoryToken(BookingEntity), useValue: repo },
      ],
    }).compile();
    service = module.get(BookingsService);
  });

  it('allows a patient to cancel their own booking', async () => {
    const result = await service.updateStatus('b-1', BookingStatus.CANCELLED, 'patient-a', Role.PATIENT);
    expect(result.status).toBe(BookingStatus.CANCELLED);
  });

  it('denies a patient cancelling another patient booking', async () => {
    await expect(
      service.updateStatus('b-1', BookingStatus.CANCELLED, 'patient-b', Role.PATIENT),
    ).rejects.toThrow('not authorized');
  });

  it('denies a patient changing a booking to a non-cancel status', async () => {
    await expect(
      service.updateStatus('b-1', BookingStatus.CONFIRMED, 'patient-a', Role.PATIENT),
    ).rejects.toThrow('not authorized');
  });

  it('denies a hospital from another hospital', async () => {
    await expect(
      service.updateStatus('b-1', BookingStatus.CONFIRMED, 'hospital-user-b', Role.HOSPITAL, 'hospital-b'),
    ).rejects.toThrow('not authorized');
  });

  it('allows the owning hospital to confirm a booking', async () => {
    const result = await service.updateStatus('b-1', BookingStatus.CONFIRMED, 'hospital-user-a', Role.HOSPITAL, 'hospital-a');
    expect(result.status).toBe(BookingStatus.CONFIRMED);
  });
});
