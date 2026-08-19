import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
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

  async markRead(id: string, userId: string): Promise<void> {
    const result = await this.notificationRepo.update({ id, userId }, { isRead: true });
    if (result.affected) return;

    const notification = await this.notificationRepo.findOne({ where: { id } });
    if (!notification) throw new NotFoundException('Notification not found');
    throw new ForbiddenException('You are not authorized to modify this notification');
  }

  async markAllRead(userId: string): Promise<void> {
    await this.notificationRepo.update({ userId, isRead: false }, { isRead: true });
  }
}
