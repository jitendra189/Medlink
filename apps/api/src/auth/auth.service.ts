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
import { BCRYPT_SALT_ROUNDS, REFRESH_TOKEN_EXPIRY_DAYS, Role } from '@medlink/shared';

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
      role: dto.role ?? Role.PATIENT,
      phone: dto.phone,
    });

    const accessToken = this.generateAccessToken(user.id, user.email, user.role);
    const refreshToken = await this.createRefreshToken(user.id);

    return {
      accessToken,
      refreshToken: refreshToken.token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    };
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user || !user.isActive) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const accessToken = this.generateAccessToken(user.id, user.email, user.role);
    await this.refreshTokenRepo.update({ userId: user.id, isRevoked: false }, { isRevoked: true });
    const refreshToken = await this.createRefreshToken(user.id);

    return {
      accessToken,
      refreshToken: refreshToken.token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    };
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

    const rotation = await this.refreshTokenRepo.update(
      { id: token.id, isRevoked: false },
      { isRevoked: true },
    );
    if (!rotation.affected) {
      throw new UnauthorizedException('Refresh token has already been used');
    }

    const newRefreshToken = await this.createRefreshToken(token.user.id);
    const accessToken = this.generateAccessToken(token.user.id, token.user.email, token.user.role);

    return { accessToken, refreshToken: newRefreshToken.token };
  }

  async logout(refreshToken: string): Promise<void> {
    if (!refreshToken) return;
    await this.refreshTokenRepo.update({ token: refreshToken }, { isRevoked: true });
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.usersService.findByEmail(email);
    if (!user) return;

    await this.passwordResetTokenRepo.update(
      { userId: user.id, isUsed: false },
      { isUsed: true },
    );

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashResetToken(token);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await this.passwordResetTokenRepo.save({
      userId: user.id,
      token: tokenHash,
      expiresAt,
      isUsed: false,
    });

    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.log(`\n[PASSWORD RESET] Reset link for ${email}:`);
      // eslint-disable-next-line no-console
      console.log(`http://localhost:5173/reset-password?token=${token}\n`);
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const tokenHash = this.hashResetToken(token);
    const resetToken = await this.passwordResetTokenRepo.findOne({
      where: { token: tokenHash, isUsed: false },
      relations: ['user'],
    });

    if (!resetToken) throw new BadRequestException('Invalid or expired reset token');
    if (new Date() > resetToken.expiresAt) throw new BadRequestException('Reset token has expired');

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);
    await this.usersService.save({ ...resetToken.user, passwordHash });
    await this.passwordResetTokenRepo.update(resetToken.id, { isUsed: true });
    await this.refreshTokenRepo.update(
      { userId: resetToken.userId, isRevoked: false },
      { isRevoked: true },
    );
  }

  private hashResetToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
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
