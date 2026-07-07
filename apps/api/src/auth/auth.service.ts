import {
  Injectable, ConflictException, UnauthorizedException, BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { RefreshTokenEntity } from '../database/entities/refresh-token.entity';
import { PasswordResetTokenEntity } from '../database/entities/password-reset-token.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { BCRYPT_SALT_ROUNDS, REFRESH_TOKEN_EXPIRY_DAYS } from '@medlink/shared';

@Injectable()
export class AuthService {
  private readonly jwtSecret: string;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    @InjectRepository(RefreshTokenEntity)
    private readonly refreshTokenRepo: Repository<RefreshTokenEntity>,
    @InjectRepository(PasswordResetTokenEntity)
    private readonly passwordResetTokenRepo: Repository<PasswordResetTokenEntity>,
  ) {
    const secret = this.config.get<string>('JWT_SECRET');
    if (!secret) throw new Error('JWT_SECRET environment variable is not configured');
    this.jwtSecret = secret;
  }

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);
    const user = await this.usersService.save({
      name: dto.name,
      email: dto.email,
      passwordHash,
      role: dto.role,
      phone: dto.phone,
    });

    const accessToken = this.generateAccessToken(user.id, user.email, user.role);
    await this.createRefreshToken(user.id);

    return { accessToken, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user || !user.isActive) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const accessToken = this.generateAccessToken(user.id, user.email, user.role);
    await this.refreshTokenRepo.update(
      { userId: user.id, isRevoked: false },
      { isRevoked: true },
    );
    await this.createRefreshToken(user.id);

    return { accessToken, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
  }

  async refresh(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const token = await this.refreshTokenRepo.findOne({
      where: { token: refreshToken, isRevoked: false },
      relations: ['user'],
    });

    if (!token || token.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (!token.user || !token.user.isActive) {
      throw new UnauthorizedException('Account deactivated');
    }

    await this.refreshTokenRepo.update(token.id, { isRevoked: true });
    const newRefreshToken = await this.createRefreshToken(token.user.id);
    const accessToken = this.generateAccessToken(token.user.id, token.user.email, token.user.role);

    return { accessToken, refreshToken: newRefreshToken.token };
  }

  async logout(refreshToken: string): Promise<void> {
    if (!refreshToken) return;
    await this.refreshTokenRepo.update({ token: refreshToken }, { isRevoked: true });
  }

  async forgotPassword(email: string): Promise<void> {
    // Always return success (don't leak if email exists)
    const user = await this.usersService.findByEmail(email);
    if (!user) return;

    // Invalidate existing tokens
    await this.passwordResetTokenRepo.update(
      { userId: user.id, isUsed: false },
      { isUsed: true },
    );

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.passwordResetTokenRepo.save({
      userId: user.id,
      token,
      expiresAt,
      isUsed: false,
    });

    // In production this would send an email
    // For portfolio: log the reset link so it can be tested
    // eslint-disable-next-line no-console
    console.log(`\n[PASSWORD RESET] Reset link for ${email}:`);
    // eslint-disable-next-line no-console
    console.log(`http://localhost:5173/reset-password?token=${token}\n`);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const resetToken = await this.passwordResetTokenRepo.findOne({
      where: { token, isUsed: false },
      relations: ['user'],
    });

    if (!resetToken) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (new Date() > resetToken.expiresAt) {
      throw new BadRequestException('Reset token has expired');
    }

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);
    await this.usersService.save({ ...resetToken.user, passwordHash });

    // Revoke the token
    await this.passwordResetTokenRepo.update(resetToken.id, { isUsed: true });

    // Revoke all refresh tokens for security
    await this.refreshTokenRepo.update(
      { userId: resetToken.userId, isRevoked: false },
      { isRevoked: true },
    );
  }

  private generateAccessToken(userId: string, email: string, role: string): string {
    return this.jwtService.sign(
      { sub: userId, email, role },
      { secret: this.jwtSecret, expiresIn: '15m' },
    );
  }

  private async createRefreshToken(userId: string): Promise<RefreshTokenEntity> {
    const token = crypto.randomBytes(64).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);
    return this.refreshTokenRepo.save({ userId, token, expiresAt });
  }
}
