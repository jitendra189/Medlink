import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { HospitalsService } from './hospitals.service';
import { HospitalEntity } from '../database/entities/hospital.entity';

const mockHospital: Partial<HospitalEntity> = {
  id: 'h-uuid-1',
  name: 'City Hospital',
  city: 'Mumbai',
  icuBedsAvailable: 5,
  latitude: 19.076,
  longitude: 72.877,
};

describe('HospitalsService', () => {
  let service: HospitalsService;
  let repo: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HospitalsService,
        {
          provide: getRepositoryToken(HospitalEntity),
          useValue: {
            find: jest.fn().mockResolvedValue([mockHospital]),
            findOne: jest.fn().mockResolvedValue(mockHospital),
            save: jest.fn().mockResolvedValue(mockHospital),
            createQueryBuilder: jest.fn().mockReturnValue({
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              skip: jest.fn().mockReturnThis(),
              take: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              getCount: jest.fn().mockResolvedValue(1),
              getMany: jest.fn().mockResolvedValue([mockHospital]),
            }),
          },
        },
      ],
    }).compile();
    service = module.get<HospitalsService>(HospitalsService);
    repo = module.get(getRepositoryToken(HospitalEntity));
  });

  it('findAll returns paginated hospitals', async () => {
    const result = await service.findAll({});
    expect(result.data).toHaveLength(1);
    expect(result.data[0].name).toBe('City Hospital');
    expect(result.meta.total).toBe(1);
  });

  it('findById returns hospital by id', async () => {
    const result = await service.findById('h-uuid-1');
    expect(result.id).toBe('h-uuid-1');
  });

  it('updateResources updates and returns hospital', async () => {
    const result = await service.updateResources('h-uuid-1', { icuBedsAvailable: 3 });
    expect(repo.save).toHaveBeenCalled();
    expect(result).toBeDefined();
  });
});
