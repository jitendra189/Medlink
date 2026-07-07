import { api } from '../lib/axios';

export const prescriptionsService = {
  getMy: () => api.get<{ data: any[] }>('/prescriptions/my').then((r) => r.data.data),
  getById: (id: string) => api.get<{ data: any }>(`/prescriptions/${id}`).then((r) => r.data.data),
  create: (data: any) => api.post<{ data: any }>('/prescriptions', data).then((r) => r.data.data),
};
