import { api } from '../lib/axios';
import type { IUser } from '@medlink/shared';

export interface AuthResponse { accessToken: string; user: IUser; }

export const authService = {
  register: (data: { name: string; email: string; password: string; role: string; phone?: string }) =>
    api.post<{ data: AuthResponse }>('/auth/register', data).then((r) => r.data.data),

  login: (data: { email: string; password: string }) =>
    api.post<{ data: AuthResponse }>('/auth/login', data).then((r) => r.data.data),

  logout: () => api.post('/auth/logout'),

  getMe: () => api.get<{ data: IUser }>('/auth/me').then((r) => r.data.data),
};
