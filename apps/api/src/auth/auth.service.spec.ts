import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { RefreshTokenEntity } from '../database/entities/refresh-token.entity';
import { Role } from '@medlink/shared';
import * as bcrypt from 'bcryptjs';

const mockUser = {
  id: 'uuid-1',
  name: 'Test',
  email: 'test@example.com',
  passwordHash: bcrypt.hashSync('Test@12345', 1),
  role: Role.PATIENT,
  isActive: true,
};

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;
  let refreshTokenRepo: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: { findByEmail: jest.fn(), findById: jest.fn(), save: jest.fn() },
        },
        {
          provide: JwtService,
          useValue: { sign: jest.fn().mockReturnValue('mock.jwt.token') },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('test-secret') },
        },
        {
          provide: getRepositoryToken(RefreshTokenEntity),
          useValue: { save: jest.fn(), findOne: jest.fn(), update: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
    refreshTokenRepo = module.get(getRepositoryToken(RefreshTokenEntity));
  });

  describe('register', () => {
    it('throws ConflictException if email already exists', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser as any);
      await expect(
        service.register({ name: 'Test', email: 'test@example.com', password: 'Test@12345', role: Role.PATIENT }),
      ).rejects.toThrow(ConflictException);
    });

    it('creates user and returns access token', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.save.mockResolvedValue(mockUser as any);
      refreshTokenRepo.save.mockResolvedValue({});
      const result = await service.register({
        name: 'Test', email: 'new@example.com', password: 'Test@12345', role: Role.PATIENT,
      });
      expect(result.accessToken).toBe('mock.jwt.token');
      expect(result.user.email).toBe('test@example.com');
    });
  });

  describe('login', () => {
    it('throws UnauthorizedException if user not found', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      await expect(service.login({ email: 'x@x.com', password: 'Test@12345' }))
        .rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException if password wrong', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser as any);
      await expect(service.login({ email: 'test@example.com', password: 'WrongPass1' }))
        .rejects.toThrow(UnauthorizedException);
    });

    it('returns access token on valid credentials', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser as any);
      refreshTokenRepo.update.mockResolvedValue({});
      refreshTokenRepo.save.mockResolvedValue({});
      const result = await service.login({ email: 'test@example.com', password: 'Test@12345' });
      expect(result.accessToken).toBe('mock.jwt.token');
    });
  });

  describe('refresh', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);

    it('throws UnauthorizedException if token not found', async () => {
      refreshTokenRepo.findOne.mockResolvedValue(null);
      await expect(service.refresh('invalid-token')).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException if token expired', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      refreshTokenRepo.findOne.mockResolvedValue({ id: 't-1', expiresAt: pastDate, user: { id: 'u-1', email: 'x@x.com', role: 'patient', isActive: true } });
      await expect(service.refresh('old-token')).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException if user is deactivated', async () => {
      refreshTokenRepo.findOne.mockResolvedValue({ id: 't-1', expiresAt: futureDate, user: { id: 'u-1', email: 'x@x.com', role: 'patient', isActive: false } });
      await expect(service.refresh('some-token')).rejects.toThrow(UnauthorizedException);
    });

    it('returns new access token and refresh token on valid token', async () => {
      refreshTokenRepo.findOne.mockResolvedValue({ id: 't-1', expiresAt: futureDate, user: { id: 'u-1', email: 'x@x.com', role: 'patient', isActive: true } });
      refreshTokenRepo.update.mockResolvedValue({});
      refreshTokenRepo.save.mockResolvedValue({ token: 'new-refresh-token' });
      const result = await service.refresh('valid-token');
      expect(result.accessToken).toBe('mock.jwt.token');
      expect(result.refreshToken).toBe('new-refresh-token');
    });
  });

  describe('logout', () => {
    it('does nothing if refreshToken is empty', async () => {
      await service.logout('');
      expect(refreshTokenRepo.update).not.toHaveBeenCalled();
    });

    it('revokes the token', async () => {
      refreshTokenRepo.update.mockResolvedValue({});
      await service.logout('some-token');
      expect(refreshTokenRepo.update).toHaveBeenCalledWith({ token: 'some-token' }, { isRevoked: true });
    });
  });
});
