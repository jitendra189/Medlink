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

  const mockDonor: Partial<BloodDonorEntity> = { id: 'd-1', userId: 'u-1', bloodGroup: BloodGroup.O_POS, isAvailable: true };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BloodService,
        {
          provide: getRepositoryToken(BloodDonorEntity),
          useValue: {
            findOne: jest.fn().mockResolvedValue(mockDonor),
            save: jest.fn().mockResolvedValue(mockDonor),
            createQueryBuilder: jest.fn().mockReturnValue({
              leftJoinAndSelect: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              skip: jest.fn().mockReturnThis(),
              take: jest.fn().mockReturnThis(),
              getCount: jest.fn().mockResolvedValue(1),
              getMany: jest.fn().mockResolvedValue([mockDonor]),
            }),
          },
        },
        {
          provide: getRepositoryToken(BloodRequestEntity),
          useValue: {
            save: jest.fn().mockResolvedValue({ id: 'r-1', patientId: 'p-1', bloodGroup: BloodGroup.O_POS, status: BloodRequestStatus.PENDING }),
            find: jest.fn().mockResolvedValue([]),
            findOne: jest.fn().mockResolvedValue({ id: 'r-1', status: BloodRequestStatus.PENDING }),
          },
        },
      ],
    }).compile();
    service = module.get<BloodService>(BloodService);
    donorRepo = module.get(getRepositoryToken(BloodDonorEntity));
    requestRepo = module.get(getRepositoryToken(BloodRequestEntity));
  });

  it('searchDonors returns paginated available donors', async () => {
    const result = await service.searchDonors({ bloodGroup: BloodGroup.O_POS });
    expect(result.data).toHaveLength(1);
    expect(result.meta.total).toBe(1);
  });

  it('createRequest saves and returns blood request', async () => {
    const result = await service.createRequest('p-1', { bloodGroup: BloodGroup.O_POS });
    expect(requestRepo.save).toHaveBeenCalled();
    expect(result.bloodGroup).toBe(BloodGroup.O_POS);
  });

  it('toggleAvailability updates donor availability', async () => {
    await service.toggleAvailability('u-1');
    expect(donorRepo.save).toHaveBeenCalledWith(expect.objectContaining({ isAvailable: false }));
  });
});
