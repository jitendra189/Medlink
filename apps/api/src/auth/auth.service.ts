import {
  Injectable, ConflictException, UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { RefreshTokenEntity } from '../database/entities/refresh-token.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { BCRYPT_SALT_ROUNDS, REFRESH_TOKEN_EXPIRY_DAYS } from '@medlink/shared';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    @InjectRepository(RefreshTokenEntity)
    private readonly refreshTokenRepo: Repository<RefreshTokenEntity>,
  ) {}

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
    await this.createRefreshToken(user.id);

    return { accessToken, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
  }

  async refresh(refreshToken: string): Promise<{ accessToken: string }> {
    const token = await this.refreshTokenRepo.findOne({
      where: { token: refreshToken, isRevoked: false },
      relations: ['user'],
    });

    if (!token || token.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    await this.refreshTokenRepo.update(token.id, { isRevoked: true });
    await this.createRefreshToken(token.user.id);
    const accessToken = this.generateAccessToken(token.user.id, token.user.email, token.user.role);

    return { accessToken };
  }

  async logout(refreshToken: string): Promise<void> {
    await this.refreshTokenRepo.update({ token: refreshToken }, { isRevoked: true });
  }

  private generateAccessToken(userId: string, email: string, role: string): string {
    return this.jwtService.sign(
      { sub: userId, email, role },
      { secret: this.config.get<string>('JWT_SECRET'), expiresIn: '15m' },
    );
  }

  private async createRefreshToken(userId: string): Promise<RefreshTokenEntity> {
    const token = crypto.randomBytes(64).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);
    return this.refreshTokenRepo.save({ userId, token, expiresAt });
  }
}
