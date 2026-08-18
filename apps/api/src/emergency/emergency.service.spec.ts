import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EmergencyService } from './emergency.service';
import { EmergencyRequestEntity } from '../database/entities/emergency-request.entity';
import { EmergencyStatus, EmergencyType } from '@medlink/shared';

const mockEmergency: EmergencyRequestEntity = {
  id: 'e-1',
  patientId: 'p-1',
  hospitalId: null,
  driverId: null,
  patient: undefined as never,
  hospital: null,
  driver: null,
  type: EmergencyType.ICU,
  status: EmergencyStatus.PENDING,
  patientLat: 19.0,
  patientLng: 72.8,
  description: '',
  resolvedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('EmergencyService', () => {
  let service: EmergencyService;
  let repo: {
    save: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
  };

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
            update: jest.fn().mockResolvedValue({ affected: 1 }),
          },
        },
      ],
    }).compile();
    service = module.get<EmergencyService>(EmergencyService);
    repo = module.get(getRepositoryToken(EmergencyRequestEntity));
  });

  it('create saves and returns emergency request', async () => {
    const result = await service.create('p-1', {
      type: EmergencyType.ICU,
      patientLat: 19.0,
      patientLng: 72.8,
    });
    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({ patientId: 'p-1', status: EmergencyStatus.PENDING }),
    );
    expect(result.patientId).toBe('p-1');
  });

  it('findPending returns pending requests', async () => {
    const result = await service.findPending();
    expect(result).toHaveLength(1);
  });

  it('accept atomically changes a pending request to accepted', async () => {
    const result = await service.accept('e-1', 'h-1');

    expect(repo.update).toHaveBeenCalledWith(
      { id: 'e-1', status: EmergencyStatus.PENDING },
      { status: EmergencyStatus.ACCEPTED, hospitalId: 'h-1' },
    );
    expect(repo.findOne).toHaveBeenCalled();
    expect(result).toBe(mockEmergency);
  });

  it('rejects accepting a request that is no longer pending', async () => {
    repo.update.mockResolvedValueOnce({ affected: 0 });
    repo.findOne.mockResolvedValueOnce({
      ...mockEmergency,
      status: EmergencyStatus.ACCEPTED,
    });

    await expect(service.accept('e-1', 'h-1')).rejects.toThrow(
      'Emergency request cannot be accepted from status accepted',
    );
  });

  it('prevents a patient from cancelling another patient\'s request', async () => {
    repo.findOne.mockResolvedValueOnce({ ...mockEmergency, patientId: 'other-patient' });

    await expect(service.cancel('e-1', 'p-1')).rejects.toThrow();
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('only resolves accepted requests', async () => {
    repo.update.mockResolvedValueOnce({ affected: 0 });
    repo.findOne.mockResolvedValueOnce(mockEmergency);

    await expect(service.resolve('e-1', 'h-1')).rejects.toThrow(
      'Emergency request cannot be resolved from status pending',
    );
  });

  it('prevents a different hospital from resolving an accepted emergency', async () => {
    repo.update.mockResolvedValueOnce({ affected: 0 });
    repo.findOne.mockResolvedValueOnce({
      ...mockEmergency,
      status: EmergencyStatus.ACCEPTED,
      hospitalId: 'h-1',
    });

    await expect(service.resolve('e-1', 'h-2')).rejects.toThrow(
      'Emergency request is assigned to another hospital',
    );
  });
});
