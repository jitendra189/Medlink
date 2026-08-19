import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from './users.service';
import { UserEntity } from '../database/entities/user.entity';
import { Role } from '@medlink/shared';

const mockUser: UserEntity = {
  id: 'uuid-1', name: 'Test User', email: 'test@example.com', passwordHash: 'hashed', role: Role.PATIENT,
  phone: null, avatarUrl: null, isActive: true, createdAt: new Date(), updatedAt: new Date(),
  hospital: null, bloodDonor: null, ambulanceDriver: null, refreshTokens: [], notifications: [],
};

describe('UsersService', () => {
  let service: UsersService;
  let repo: jest.Mocked<Repository<UserEntity>> & { createQueryBuilder: jest.Mock };
  let qb: any;

  beforeEach(async () => {
    qb = { addSelect: jest.fn().mockReturnThis(), where: jest.fn().mockReturnThis(), getOne: jest.fn().mockResolvedValue(mockUser) };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: { findOne: jest.fn(), save: jest.fn(), createQueryBuilder: jest.fn().mockReturnValue(qb) },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repo = module.get(getRepositoryToken(UserEntity));
  });

  it('findByEmail explicitly selects the hidden password hash for authentication', async () => {
    const result = await service.findByEmail('test@example.com');
    expect(result).toEqual(mockUser);
    expect(repo.createQueryBuilder).toHaveBeenCalledWith('user');
    expect(qb.addSelect).toHaveBeenCalledWith('user.passwordHash');
    expect(qb.where).toHaveBeenCalledWith('user.email = :email', { email: 'test@example.com' });
  });

  it('findById uses normal projection without password hash', async () => {
    repo.findOne.mockResolvedValue(mockUser);
    const result = await service.findById('uuid-1');
    expect(result).toEqual(mockUser);
    expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 'uuid-1' } });
  });
});
