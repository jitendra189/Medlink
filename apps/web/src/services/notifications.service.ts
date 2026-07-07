import { api } from '../lib/axios';

export const notificationsService = {
  getAll: () => api.get<{ data: any[] }>('/notifications').then((r) => r.data.data),
  markRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
};
