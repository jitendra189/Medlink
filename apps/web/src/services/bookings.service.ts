import { api } from '../lib/axios';
import { BookingType } from '@medlink/shared';

export const bookingsService = {
  create: (data: { doctorId: string; hospitalId: string; type: BookingType; scheduledAt: string; notes?: string }) =>
    api.post<{ data: any }>('/bookings', data).then((r) => r.data.data),
  getMy: () => api.get<{ data: any[] }>('/bookings/my').then((r) => r.data.data),
  getHospital: () => api.get<{ data: any[] }>('/bookings/hospital').then((r) => r.data.data),
  confirm: (id: string) => api.put<{ data: any }>(`/bookings/${id}/confirm`).then((r) => r.data.data),
  cancel: (id: string) => api.put<{ data: any }>(`/bookings/${id}/cancel`).then((r) => r.data.data),
  complete: (id: string) => api.put<{ data: any }>(`/bookings/${id}/complete`).then((r) => r.data.data),
};
