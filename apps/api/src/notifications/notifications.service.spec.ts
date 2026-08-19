import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { NotificationEntity } from '../database/entities/notification.entity';


describe('NotificationsService authorization', () => {
  let service: NotificationsService;
  let repo: any;

  beforeEach(async () => {
    repo = {
      update: jest.fn().mockResolvedValue({ affected: 1 }),
      findOne: jest.fn().mockResolvedValue({ id: 'n-1', userId: 'user-b' }),
      find: jest.fn(),
      save: jest.fn(),
    };
    const module = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: getRepositoryToken(NotificationEntity), useValue: repo },
      ],
    }).compile();
    service = module.get(NotificationsService);
  });

  it('scopes mark-read update to the authenticated user', async () => {
    await service.markRead('n-1', 'user-a');
    expect(repo.update).toHaveBeenCalledWith({ id: 'n-1', userId: 'user-a' }, { isRead: true });
  });

  it('throws when the notification does not belong to the authenticated user', async () => {
    repo.update.mockResolvedValue({ affected: 0 });
    await expect(service.markRead('n-1', 'user-a')).rejects.toThrow('not authorized');
  });
});
