import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;
  const dataSource = {
    isInitialized: true,
    query: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    dataSource.isInitialized = true;
    dataSource.query.mockResolvedValue([{ '?column?': 1 }]);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: DataSource,
          useValue: dataSource,
        },
      ],
    }).compile();
    controller = module.get<HealthController>(HealthController);
  });

  it('returns ok when the database is reachable', async () => {
    const result = await controller.check();

    expect(result.status).toBe('ok');
    expect(result.database).toBe('ok');
    expect(result.timestamp).toBeDefined();
    expect(dataSource.query).toHaveBeenCalledWith('SELECT 1');
  });

  it('throws when the database is not initialized', async () => {
    dataSource.isInitialized = false;

    await expect(controller.check()).rejects.toMatchObject({
      response: { status: 'unavailable', database: 'disconnected' },
    });
    expect(dataSource.query).not.toHaveBeenCalled();
  });

  it('throws when the database query fails', async () => {
    dataSource.query.mockRejectedValueOnce(new Error('database unavailable'));

    await expect(controller.check()).rejects.toMatchObject({
      response: { status: 'unavailable', database: 'unreachable' },
    });
  });
});
