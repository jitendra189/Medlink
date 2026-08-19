import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AmbulanceService } from './ambulance.service';
import { AmbulanceDriverEntity } from '../database/entities/ambulance-driver.entity';
import { EmergencyRequestEntity } from '../database/entities/emergency-request.entity';
import { EmergencyStatus, Role } from '@medlink/shared';

function emergencyQuery(authorized: boolean) {
  return {
    leftJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getExists: jest.fn().mockResolvedValue(authorized),
  };
}

describe('AmbulanceService driver location authorization', () => {
  let service: AmbulanceService;
  let emergencyRepo: any;
  const driver = { id: 'driver-1', userId: 'driver-user', latitude: 10, longitude: 20, lastLocationAt: new Date() } as AmbulanceDriverEntity;

  beforeEach(async () => {
    emergencyRepo = { createQueryBuilder: jest.fn().mockReturnValue(emergencyQuery(true)) };
    const driverRepo = { findOne: jest.fn().mockResolvedValue(driver) };
    const module = await Test.createTestingModule({
      providers: [
        AmbulanceService,
        { provide: getRepositoryToken(AmbulanceDriverEntity), useValue: driverRepo },
        { provide: getRepositoryToken(EmergencyRequestEntity), useValue: emergencyRepo },
      ],
    }).compile();
    service = module.get(AmbulanceService);
  });

  it('allows the assigned patient to track the driver', async () => {
    const result = await service.getDriverLocation('driver-1', { id: 'patient-a', role: Role.PATIENT } as any);
    expect(result.latitude).toBe(10);
  });

  it('denies an unrelated patient', async () => {
    emergencyRepo.createQueryBuilder.mockReturnValue(emergencyQuery(false));
    await expect(
      service.getDriverLocation('driver-1', { id: 'patient-b', role: Role.PATIENT } as any),
    ).rejects.toThrow('not authorized');
  });

  it('allows the driver to see their own location', async () => {
    const result = await service.getDriverLocation('driver-1', { id: 'driver-user', role: Role.DRIVER } as any);
    expect(result.longitude).toBe(20);
  });

  it('uses only accepted emergencies for patient/hospital tracking', async () => {
    await service.getDriverLocation('driver-1', { id: 'patient-a', role: Role.PATIENT } as any);
    const qb = emergencyRepo.createQueryBuilder.mock.results[0].value;
    expect(qb.andWhere).toHaveBeenCalledWith('e.status = :status', { status: EmergencyStatus.ACCEPTED });
  });
});
