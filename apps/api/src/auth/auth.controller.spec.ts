import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Role } from '@medlink/shared';

const mockAuthResponse = {
  accessToken: 'mock.jwt.token',
  user: { id: 'uuid-1', name: 'Test', email: 'test@example.com', role: Role.PATIENT },
};

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            register: jest.fn().mockResolvedValue(mockAuthResponse),
            login: jest.fn().mockResolvedValue({ ...mockAuthResponse, refreshToken: 'mock-refresh-token' }),
            refresh: jest.fn().mockResolvedValue({ accessToken: 'new.token', refreshToken: 'new-refresh-token' }),
            logout: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  it('register calls authService.register and returns response', async () => {
    const dto = { name: 'Test', email: 'test@example.com', password: 'Test@12345', role: Role.PATIENT };
    const result = await controller.register(dto as any);
    expect(authService.register).toHaveBeenCalledWith(dto);
    expect(result).toEqual(mockAuthResponse);
  });

  it('login calls authService.login', async () => {
    const dto = { email: 'test@example.com', password: 'Test@12345' };
    const mockRes = { cookie: jest.fn() } as any;
    const result = await controller.login(dto as any, mockRes);
    expect(authService.login).toHaveBeenCalledWith(dto);
    expect(mockRes.cookie).toHaveBeenCalledWith('refreshToken', 'mock-refresh-token', expect.any(Object));
    expect(result).toMatchObject({ accessToken: 'mock.jwt.token' });
  });

  it('getMe returns current user from request', async () => {
    const mockUser = { id: 'uuid-1', name: 'Test', email: 'test@example.com', role: Role.PATIENT };
    const result = await controller.getMe(mockUser as any);
    expect(result).toEqual(mockUser);
  });
});
