import { api } from '../lib/axios';
import type { IEmergencyRequest } from '@medlink/shared';
import { EmergencyType } from '@medlink/shared';

export const emergencyService = {
  create: (data: { type: EmergencyType; patientLat: number; patientLng: number; description?: string }) =>
    api.post<{ data: IEmergencyRequest }>('/emergency', data).then((r) => r.data.data),

  getPending: () =>
    api.get<{ data: IEmergencyRequest[] }>('/emergency').then((r) => r.data.data),

  getMy: () =>
    api.get<{ data: IEmergencyRequest[] }>('/emergency/my').then((r) => r.data.data),

  accept: (id: string) =>
    api.put<{ data: IEmergencyRequest }>(`/emergency/${id}/accept`).then((r) => r.data.data),

  reject: (id: string) =>
    api.put<{ data: IEmergencyRequest }>(`/emergency/${id}/reject`).then((r) => r.data.data),

  cancel: (id: string) =>
    api.put<{ data: IEmergencyRequest }>(`/emergency/${id}/cancel`).then((r) => r.data.data),

  resolve: (id: string) =>
    api.put<{ data: IEmergencyRequest }>(`/emergency/${id}/resolve`).then((r) => r.data.data),
};
