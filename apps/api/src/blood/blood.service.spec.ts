import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BloodService } from './blood.service';
import { BloodDonorEntity } from '../database/entities/blood-donor.entity';
import { BloodRequestEntity } from '../database/entities/blood-request.entity';
import { BloodGroup, BloodRequestStatus } from '@medlink/shared';

describe('BloodService', () => {
  let service: BloodService;
  let donorRepo: any;
  let requestRepo: any;
  let manager: any;

  const mockDonor: Partial<BloodDonorEntity> = { id: 'd-1', userId: 'u-1', bloodGroup: BloodGroup.O_POS, isAvailable: true, totalDonations: 0 };
  const mockRequest: Partial<BloodRequestEntity> = { id: 'r-1', patientId: 'p-1', bloodGroup: BloodGroup.O_POS, status: BloodRequestStatus.PENDING };

  beforeEach(async () => {
    mockDonor.bloodGroup = BloodGroup.O_POS;
    mockDonor.isAvailable = true;
    mockDonor.totalDonations = 0;
    mockRequest.bloodGroup = BloodGroup.O_POS;
    mockRequest.status = BloodRequestStatus.PENDING;
    manager = {
      findOne: jest.fn().mockImplementation((entity: unknown) => entity === BloodDonorEntity ? mockDonor : mockRequest),
      save: jest.fn().mockImplementation((entity: unknown) => Promise.resolve(entity)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BloodService,
        { provide: getRepositoryToken(BloodDonorEntity), useValue: {
          findOne: jest.fn().mockResolvedValue(mockDonor), save: jest.fn().mockResolvedValue(mockDonor),
          createQueryBuilder: jest.fn().mockReturnValue({ leftJoinAndMapOne: jest.fn().mockReturnThis(), addSelect: jest.fn().mockReturnThis(), where: jest.fn().mockReturnThis(), andWhere: jest.fn().mockReturnThis(), skip: jest.fn().mockReturnThis(), take: jest.fn().mockReturnThis(), getCount: jest.fn().mockResolvedValue(1), getMany: jest.fn().mockResolvedValue([mockDonor]) }),
        } },
        { provide: getRepositoryToken(BloodRequestEntity), useValue: {
          manager: { transaction: jest.fn((callback) => callback(manager)) }, save: jest.fn().mockResolvedValue(mockRequest),
          find: jest.fn().mockResolvedValue([]), findOne: jest.fn().mockResolvedValue(mockRequest), findOneOrFail: jest.fn().mockResolvedValue(mockRequest), update: jest.fn().mockResolvedValue({ affected: 1 }),
        } },
      ],
    }).compile();
    service = module.get(BloodService);
    donorRepo = module.get(getRepositoryToken(BloodDonorEntity));
    requestRepo = module.get(getRepositoryToken(BloodRequestEntity));
  });

  it('searchDonors returns paginated available donors without selecting password fields', async () => {
    const result = await service.searchDonors({ bloodGroup: BloodGroup.O_POS });
    expect(result.data).toHaveLength(1);
    expect(result.meta.total).toBe(1);
    const qb = donorRepo.createQueryBuilder.mock.results[0].value;
    expect(qb.addSelect).toHaveBeenCalledWith(['u.id', 'u.name']);
  });

  it('createRequest saves and returns blood request', async () => {
    const result = await service.createRequest('p-1', { bloodGroup: BloodGroup.O_POS });
    expect(requestRepo.save).toHaveBeenCalled();
    expect(result.bloodGroup).toBe(BloodGroup.O_POS);
  });

  it('donor-facing pending requests do not load patient PII', async () => {
    await service.findPendingRequests();
    expect(requestRepo.find).toHaveBeenCalledWith({ where: { status: BloodRequestStatus.PENDING } });
  });

  it('fulfills a compatible pending request atomically', async () => {
    await service.fulfill('r-1', 'u-1');
    expect(manager.save).toHaveBeenCalledWith(expect.objectContaining({ donorId: 'd-1' }));
    expect(mockRequest.status).toBe(BloodRequestStatus.FULFILLED);
  });

  it('rejects an incompatible donor', async () => {
    mockDonor.bloodGroup = BloodGroup.A_POS;
    mockRequest.bloodGroup = BloodGroup.O_NEG;
    await expect(service.fulfill('r-1', 'u-1')).rejects.toThrow('not compatible');
  });

  it('cancels only a request owned by the patient', async () => {
    await service.cancel('r-1', 'p-1');
    expect(requestRepo.update).toHaveBeenCalledWith({ id: 'r-1', patientId: 'p-1', status: BloodRequestStatus.PENDING }, { status: BloodRequestStatus.CANCELLED });
  });

  it('toggleAvailability updates donor availability', async () => {
    await service.toggleAvailability('u-1');
    expect(donorRepo.save).toHaveBeenCalledWith(expect.objectContaining({ isAvailable: false }));
  });
});
