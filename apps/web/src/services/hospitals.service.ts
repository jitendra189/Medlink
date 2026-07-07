import { api } from '../lib/axios';
import type { IHospital } from '@medlink/shared';

export const hospitalsService = {
  getAll: (params?: { city?: string; icuAvailable?: boolean }) =>
    api.get<{ data: IHospital[] }>('/hospitals', { params }).then((r) => r.data.data),

  getNearby: (lat: number, lng: number, radiusKm?: number) =>
    api.get<{ data: IHospital[] }>('/hospitals/nearby', { params: { lat, lng, radiusKm } }).then((r) => r.data.data),

  getById: (id: string) =>
    api.get<{ data: IHospital }>(`/hospitals/${id}`).then((r) => r.data.data),

  getDashboard: () =>
    api.get<{ data: IHospital }>('/hospitals/dashboard').then((r) => r.data.data),

  updateResources: (data: Partial<IHospital>) =>
    api.put<{ data: IHospital }>('/hospitals/resources', data).then((r) => r.data.data),

  getDoctors: (id: string) =>
    api.get<{ data: any[] }>(`/hospitals/${id}/doctors`).then((r) => r.data.data),

  getResources: (id: string) =>
    api.get<{ data: any }>(`/hospitals/${id}/resources`).then((r) => r.data.data),
};
