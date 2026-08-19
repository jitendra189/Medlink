import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../database/entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  findByEmail(email: string): Promise<UserEntity | null> {
    return this.userRepo
      .createQueryBuilder('user')
      .addSelect('user.password_hash')
      .where('user.email = :email', { email })
      .getOne();
  }

  findById(id: string): Promise<UserEntity | null> {
    return this.userRepo.findOne({ where: { id } });
  }

  save(user: Partial<UserEntity>): Promise<UserEntity> {
    return this.userRepo.save(user);
  }

  async updateAvatar(userId: string, avatarUrl: string): Promise<UserEntity> {
    await this.userRepo.update(userId, { avatarUrl });
    return this.userRepo.findOneOrFail({ where: { id: userId } });
  }
}
