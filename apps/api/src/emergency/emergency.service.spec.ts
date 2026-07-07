import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EmergencyService } from './emergency.service';
import { EmergencyRequestEntity } from '../database/entities/emergency-request.entity';
import { EmergencyStatus, EmergencyType } from '@medlink/shared';

const mockEmergency: Partial<EmergencyRequestEntity> = {
  id: 'e-1', patientId: 'p-1', type: EmergencyType.ICU,
  status: EmergencyStatus.PENDING, patientLat: 19.0, patientLng: 72.8,
};

describe('EmergencyService', () => {
  let service: EmergencyService;
  let repo: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmergencyService,
        {
          provide: getRepositoryToken(EmergencyRequestEntity),
          useValue: {
            save: jest.fn().mockResolvedValue(mockEmergency),
            find: jest.fn().mockResolvedValue([mockEmergency]),
            findOne: jest.fn().mockResolvedValue(mockEmergency),
          },
        },
      ],
    }).compile();
    service = module.get<EmergencyService>(EmergencyService);
    repo = module.get(getRepositoryToken(EmergencyRequestEntity));
  });

  it('create saves and returns emergency request', async () => {
    const result = await service.create('p-1', { type: EmergencyType.ICU, patientLat: 19.0, patientLng: 72.8 });
    expect(repo.save).toHaveBeenCalled();
    expect(result.patientId).toBe('p-1');
  });

  it('findPending returns pending requests', async () => {
    const result = await service.findPending();
    expect(result).toHaveLength(1);
  });

  it('accept updates status to accepted', async () => {
    const result = await service.accept('e-1', 'h-1');
    expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ status: EmergencyStatus.ACCEPTED, hospitalId: 'h-1' }));
  });
});
