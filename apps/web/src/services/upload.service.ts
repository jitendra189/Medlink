import { api } from '../lib/axios';

export const uploadService = {
  uploadAvatar: async (file: File): Promise<{ url: string; filename: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post<{ data: { url: string; filename: string } }>('/uploads/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },

  uploadPrescription: async (file: File): Promise<{ url: string; filename: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post<{ data: { url: string; filename: string } }>('/uploads/prescription', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },
};
