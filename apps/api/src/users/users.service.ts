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
    return this.userRepo.findOne({ where: { email } });
  }

  findById(id: string): Promise<UserEntity | null> {
    return this.userRepo.findOne({ where: { id } });
  }

  save(user: Partial<UserEntity>): Promise<UserEntity> {
    return this.userRepo.save(user);
  }
}
