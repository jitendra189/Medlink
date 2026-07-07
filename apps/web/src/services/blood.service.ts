import { api } from '../lib/axios';
import { BloodGroup } from '@medlink/shared';

interface PaginatedMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface PaginatedDonors {
  data: any[];
  meta: PaginatedMeta;
}

export const bloodService = {
  searchDonors: (params?: { bloodGroup?: BloodGroup; city?: string; page?: number; limit?: number }) =>
    api.get<{ data: PaginatedDonors }>('/blood/donors', { params }).then((r) => r.data.data),

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
