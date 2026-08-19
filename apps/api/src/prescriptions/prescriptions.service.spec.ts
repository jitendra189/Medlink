import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PrescriptionsService } from './prescriptions.service';
import { PrescriptionEntity } from '../database/entities/prescription.entity';
import { Role } from '@medlink/shared';

function queryBuilder(result: PrescriptionEntity | null) {
  const qb = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getOne: jest.fn().mockResolvedValue(result),
    getExists: jest.fn().mockResolvedValue(true),
  };
  return qb;
}

describe('PrescriptionsService authorization', () => {
  const prescription = { id: 'p-1', patientId: 'patient-a' } as PrescriptionEntity;
  let service: PrescriptionsService;
  let repo: any;

  beforeEach(async () => {
    repo = {
      create: jest.fn().mockReturnValue(prescription),
      save: jest.fn().mockResolvedValue(prescription),
      delete: jest.fn().mockResolvedValue(undefined),
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder(prescription)),
      find: jest.fn(),
    };
    const module = await Test.createTestingModule({
      providers: [
        PrescriptionsService,
        { provide: getRepositoryToken(PrescriptionEntity), useValue: repo },
      ],
    }).compile();
    service = module.get(PrescriptionsService);
  });

  it('allows the owning patient to read a prescription', async () => {
    const result = await service.findByIdForUser('p-1', { id: 'patient-a', role: Role.PATIENT } as any);
    expect(result.id).toBe('p-1');
  });

  it('allows a hospital user when the prescription belongs to its hospital', async () => {
    const result = await service.findByIdForUser('p-1', { id: 'hospital-user-a', role: Role.HOSPITAL } as any);
    expect(result.id).toBe('p-1');
  });

  it('denies unsupported roles', async () => {
    await expect(
      service.findByIdForUser('p-1', { id: 'driver-a', role: Role.DRIVER } as any),
    ).rejects.toThrow('not authorized');
  });
});
