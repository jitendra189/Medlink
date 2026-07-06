import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from './users.service';
import { UserEntity } from '../database/entities/user.entity';
import { Role } from '@medlink/shared';

const mockUser: UserEntity = {
  id: 'uuid-1',
  name: 'Test User',
  email: 'test@example.com',
  passwordHash: 'hashed',
  role: Role.PATIENT,
  phone: null,
  avatarUrl: null,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  hospital: null,
  bloodDonor: null,
  ambulanceDriver: null,
  refreshTokens: [],
  notifications: [],
};

describe('UsersService', () => {
  let service: UsersService;
  let repo: jest.Mocked<Repository<UserEntity>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repo = module.get(getRepositoryToken(UserEntity));
  });

  it('findByEmail returns user when found', async () => {
    repo.findOne.mockResolvedValue(mockUser);
    const result = await service.findByEmail('test@example.com');
    expect(result).toEqual(mockUser);
    expect(repo.findOne).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
  });

  it('findByEmail returns null when not found', async () => {
    repo.findOne.mockResolvedValue(null);
    const result = await service.findByEmail('nobody@example.com');
    expect(result).toBeNull();
  });

  it('findById returns user when found', async () => {
    repo.findOne.mockResolvedValue(mockUser);
    const result = await service.findById('uuid-1');
    expect(result).toEqual(mockUser);
  });
});
