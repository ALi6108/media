import api from '@/lib/axios';

export const reportsApi = {
  getAll: () =>
    api.get('/api/v1/reports'),

  preview: (year: number, quarter: number) =>
    api.get('/api/v1/reports/preview', { params: { year, quarter } }),

  generate: (data: { quarter: number; year: number }) =>
    api.post('/api/v1/reports/generate', data),

  upload: (file: File, quarter: number, year: number) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/api/v1/reports/upload?quarter=${quarter}&year=${year}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  delete: (id: string) =>
    api.delete(`/api/v1/reports/${id}`),
};
