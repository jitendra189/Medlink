import { api } from '../lib/axios';
import { BloodGroup } from '@medlink/shared';

export const bloodService = {
  searchDonors: (params?: { bloodGroup?: BloodGroup; city?: string }) =>
    api.get<{ data: any[] }>('/blood/donors', { params }).then((r) => r.data.data),

  createRequest: (data: { bloodGroup: BloodGroup; unitsRequired?: number; urgency?: string }) =>
    api.post<{ data: any }>('/blood/requests', data).then((r) => r.data.data),

  getMyRequests: () =>
    api.get<{ data: any[] }>('/blood/requests/my').then((r) => r.data.data),

  getPendingRequests: () =>
    api.get<{ data: any[] }>('/blood/requests/pending').then((r) => r.data.data),

  fulfill: (id: string) =>
    api.put<{ data: any }>(`/blood/requests/${id}/fulfill`).then((r) => r.data.data),

  cancel: (id: string) =>
    api.put<{ data: any }>(`/blood/requests/${id}/cancel`).then((r) => r.data.data),

  getDashboard: () =>
    api.get<{ data: any }>('/blood/dashboard').then((r) => r.data.data),

  toggleAvailability: () =>
    api.put<{ data: any }>('/blood/availability').then((r) => r.data.data),
};
