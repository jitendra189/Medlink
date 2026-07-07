import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationEntity } from '../database/entities/notification.entity';
import { NotificationType } from '@medlink/shared';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(NotificationEntity)
    private readonly notificationRepo: Repository<NotificationEntity>,
  ) {}

  create(userId: string, type: NotificationType, title: string, message: string, referenceId?: string): Promise<NotificationEntity> {
    return this.notificationRepo.save({ userId, type, title, message, referenceId });
  }

  findByUser(userId: string): Promise<NotificationEntity[]> {
    return this.notificationRepo.find({ where: { userId }, order: { createdAt: 'DESC' }, take: 50 });
  }

  async markRead(id: string): Promise<void> {
    await this.notificationRepo.update(id, { isRead: true });
  }

  async markAllRead(userId: string): Promise<void> {
    await this.notificationRepo.update({ userId, isRead: false }, { isRead: true });
  }
}
