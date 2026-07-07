import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DoctorsService } from './doctors.service';
import { DoctorEntity } from '../database/entities/doctor.entity';

const mockDoctor: Partial<DoctorEntity> = { id: 'd-1', name: 'Dr. Sharma', hospitalId: 'h-1', isAvailable: true };

describe('DoctorsService', () => {
  let service: DoctorsService;
  let repo: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DoctorsService,
        {
          provide: getRepositoryToken(DoctorEntity),
          useValue: {
            find: jest.fn().mockResolvedValue([mockDoctor]),
            findOne: jest.fn().mockResolvedValue(mockDoctor),
            save: jest.fn().mockResolvedValue(mockDoctor),
            delete: jest.fn().mockResolvedValue({ affected: 1 }),
          },
        },
      ],
    }).compile();
    service = module.get<DoctorsService>(DoctorsService);
    repo = module.get(getRepositoryToken(DoctorEntity));
  });

  it('create saves a new doctor', async () => {
    const result = await service.create('h-1', { name: 'Dr. Sharma' });
    expect(repo.save).toHaveBeenCalledWith({ hospitalId: 'h-1', name: 'Dr. Sharma' });
    expect(result.name).toBe('Dr. Sharma');
  });

  it('findByHospital returns doctors for a hospital', async () => {
    const result = await service.findByHospital('h-1');
    expect(result).toHaveLength(1);
  });
});
