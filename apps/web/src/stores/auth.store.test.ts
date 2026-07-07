import { renderHook, act } from '@testing-library/react';
import { useAuthStore } from './auth.store';
import { Role } from '@medlink/shared';

const mockUser = {
  id: '1',
  name: 'Test',
  email: 'test@x.com',
  role: Role.PATIENT,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

vi.mock('../lib/socket', () => ({
  connectSocket: vi.fn(),
  disconnectSocket: vi.fn(),
}));

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false });
    localStorage.clear();
  });

  it('setAuth stores user and token', () => {
    const { result } = renderHook(() => useAuthStore());
    act(() => result.current.setAuth(mockUser, 'token123'));
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.email).toBe('test@x.com');
    expect(localStorage.getItem('accessToken')).toBe('token123');
  });

  it('clearAuth removes user and token', () => {
    const { result } = renderHook(() => useAuthStore());
    act(() => result.current.setAuth(mockUser, 'token123'));
    act(() => result.current.clearAuth());
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(localStorage.getItem('accessToken')).toBeNull();
  });
});
