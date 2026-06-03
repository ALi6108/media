import api from '@/lib/axios';

export const eventsApi = {
  getAll: (params?: { year?: number; week?: number; event_type?: string }) =>
    api.get('/api/v1/events', { params }),

  getById: (id: string) =>
    api.get(`/api/v1/events/${id}`),

  create: (data: {
    title: string; description?: string; event_date: string;
    event_type: 'LIPUTAN' | 'KEGIATAN_RUTIN' | 'HARI_BESAR' | 'RAPAT' | 'LAINNYA';
    period_week: number; period_year: number;
  }) => api.post('/api/v1/events', data),

  update: (id: string, data: Record<string, unknown>) =>
    api.patch(`/api/v1/events/${id}`, data),

  delete: (id: string) =>
    api.delete(`/api/v1/events/${id}`),
};
