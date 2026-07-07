import { api } from '../lib/axios';

export const ambulanceService = {
  toggleDuty: () => api.put<{ data: any }>('/ambulance/duty').then((r) => r.data.data),
  updateLocation: (latitude: number, longitude: number) =>
    api.put<{ data: any }>('/ambulance/location', { latitude, longitude }).then((r) => r.data.data),
  getRequests: () => api.get<{ data: any[] }>('/ambulance/requests').then((r) => r.data.data),
  trackDriver: (driverId: string) => api.get<{ data: any }>(`/ambulance/track/${driverId}`).then((r) => r.data.data),
};
