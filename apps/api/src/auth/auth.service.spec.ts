import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { RefreshTokenEntity } from '../database/entities/refresh-token.entity';
import { PasswordResetTokenEntity } from '../database/entities/password-reset-token.entity';
import { Role } from '@medlink/shared';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

const mockUser = {
  id: 'uuid-1', name: 'Test', email: 'test@example.com', passwordHash: bcrypt.hashSync('Test@12345', 1), role: Role.PATIENT, isActive: true,
};
const hashToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex');

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;
  let refreshTokenRepo: any;
  let passwordResetTokenRepo: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: { findByEmail: jest.fn(), findById: jest.fn(), save: jest.fn() } },
        { provide: JwtService, useValue: { sign: jest.fn().mockReturnValue('mock.jwt.token') } },
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue('test-secret') } },
        { provide: getRepositoryToken(RefreshTokenEntity), useValue: { save: jest.fn(), findOne: jest.fn(), update: jest.fn() } },
        { provide: getRepositoryToken(PasswordResetTokenEntity), useValue: { save: jest.fn(), findOne: jest.fn(), update: jest.fn() } },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
    refreshTokenRepo = module.get(getRepositoryToken(RefreshTokenEntity));
    passwordResetTokenRepo = module.get(getRepositoryToken(PasswordResetTokenEntity));
  });

  describe('register', () => {
    it('throws ConflictException if email already exists', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser as any);
      await expect(service.register({ name: 'Test', email: 'test@example.com', password: 'Test@12345', role: Role.PATIENT })).rejects.toThrow(ConflictException);
    });

    it('creates user and returns access token', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.save.mockResolvedValue(mockUser as any);
      refreshTokenRepo.save.mockResolvedValue({});
      const result = await service.register({ name: 'Test', email: 'new@example.com', password: 'Test@12345', role: Role.PATIENT });
      expect(result.accessToken).toBe('mock.jwt.token');
      expect(result.user.email).toBe('test@example.com');
    });
  });

  describe('login', () => {
    it('throws UnauthorizedException if user not found', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      await expect(service.login({ email: 'x@x.com', password: 'Test@12345' })).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException if password wrong', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser as any);
      await expect(service.login({ email: 'test@example.com', password: 'WrongPass1' })).rejects.toThrow(UnauthorizedException);
    });

    it('returns access token on valid credentials', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser as any);
      refreshTokenRepo.update.mockResolvedValue({ affected: 1 });
      refreshTokenRepo.save.mockResolvedValue({});
      const result = await service.login({ email: 'test@example.com', password: 'Test@12345' });
      expect(result.accessToken).toBe('mock.jwt.token');
    });
  });

  describe('refresh', () => {
    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    it('throws UnauthorizedException if token not found', async () => {
      refreshTokenRepo.findOne.mockResolvedValue(null);
      await expect(service.refresh('invalid-token')).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException if token expired', async () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      refreshTokenRepo.findOne.mockResolvedValue({ id: 't-1', expiresAt: pastDate, user: { id: 'u-1', email: 'x@x.com', role: 'patient', isActive: true } });
      await expect(service.refresh('old-token')).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException if user is deactivated', async () => {
      refreshTokenRepo.findOne.mockResolvedValue({ id: 't-1', expiresAt: futureDate, user: { id: 'u-1', email: 'x@x.com', role: 'patient', isActive: false } });
      await expect(service.refresh('some-token')).rejects.toThrow(UnauthorizedException);
    });

    it('returns new tokens on valid rotation', async () => {
      refreshTokenRepo.findOne.mockResolvedValue({ id: 't-1', expiresAt: futureDate, user: { id: 'u-1', email: 'x@x.com', role: 'patient', isActive: true } });
      refreshTokenRepo.update.mockResolvedValue({ affected: 1 });
      refreshTokenRepo.save.mockResolvedValue({ token: 'new-refresh-token' });
      const result = await service.refresh('valid-token');
      expect(result.accessToken).toBe('mock.jwt.token');
      expect(result.refreshToken).toBe('new-refresh-token');
      expect(refreshTokenRepo.update).toHaveBeenCalledWith({ id: 't-1', isRevoked: false }, { isRevoked: true });
    });

    it('rejects a refresh token that lost the single-use race', async () => {
      refreshTokenRepo.findOne.mockResolvedValue({ id: 't-1', expiresAt: futureDate, user: { id: 'u-1', email: 'x@x.com', role: 'patient', isActive: true } });
      refreshTokenRepo.update.mockResolvedValue({ affected: 0 });
      await expect(service.refresh('already-used-token')).rejects.toThrow('already been used');
      expect(refreshTokenRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('does nothing if refreshToken is empty', async () => {
      await service.logout('');
      expect(refreshTokenRepo.update).not.toHaveBeenCalled();
    });

    it('revokes the token', async () => {
      await service.logout('some-token');
      expect(refreshTokenRepo.update).toHaveBeenCalledWith({ token: 'some-token' }, { isRevoked: true });
    });
  });

  describe('forgotPassword', () => {
    it('silently returns when email is not registered', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      await service.forgotPassword('nobody@example.com');
      expect(passwordResetTokenRepo.save).not.toHaveBeenCalled();
    });

    it('invalidates existing tokens and creates a hashed reset token', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser as any);
      passwordResetTokenRepo.update.mockResolvedValue({});
      passwordResetTokenRepo.save.mockResolvedValue({});
      await service.forgotPassword('test@example.com');
      expect(passwordResetTokenRepo.save).toHaveBeenCalledWith(expect.objectContaining({ userId: mockUser.id, isUsed: false }));
      const savedArg = passwordResetTokenRepo.save.mock.calls[0][0];
      expect(savedArg.token).toHaveLength(64);
    });
  });

  describe('resetPassword', () => {
    const futureDate = new Date(Date.now() + 60 * 60 * 1000);
    const pastDate = new Date(Date.now() - 60 * 60 * 1000);

    it('throws BadRequestException if token not found', async () => {
      passwordResetTokenRepo.findOne.mockResolvedValue(null);
      await expect(service.resetPassword('bogus', 'NewPass123')).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException if token expired', async () => {
      passwordResetTokenRepo.findOne.mockResolvedValue({ id: 'rt-1', userId: mockUser.id, token: hashToken('tok'), isUsed: false, expiresAt: pastDate, user: mockUser });
      await expect(service.resetPassword('tok', 'NewPass123')).rejects.toThrow(BadRequestException);
    });

    it('updates password and revokes sessions on success', async () => {
      passwordResetTokenRepo.findOne.mockResolvedValue({ id: 'rt-1', userId: mockUser.id, token: hashToken('tok'), isUsed: false, expiresAt: futureDate, user: { ...mockUser } });
      usersService.save.mockResolvedValue(mockUser as any);
      await service.resetPassword('tok', 'NewPass123');
      expect(usersService.save).toHaveBeenCalledWith(expect.objectContaining({ id: mockUser.id, passwordHash: expect.any(String) }));
      expect(passwordResetTokenRepo.update).toHaveBeenCalledWith('rt-1', { isUsed: true });
      expect(refreshTokenRepo.update).toHaveBeenCalledWith({ userId: mockUser.id, isRevoked: false }, { isRevoked: true });
    });
  });
});
