import api from '@/lib/axios';

export const usersApi = {
  getAll: () =>
    api.get('/api/v1/users'),

  getById: (id: string) =>
    api.get(`/api/v1/users/${id}`),

  create: (data: { email: string; password: string; full_name: string; role: 'ADMIN' | 'VIEWER' }) =>
    api.post('/api/v1/users', data),

  update: (id: string, data: Record<string, unknown>) =>
    api.patch(`/api/v1/users/${id}`, data),

  delete: (id: string) =>
    api.delete(`/api/v1/users/${id}`),

  toggleActive: (id: string) =>
    api.patch(`/api/v1/users/${id}/toggle-active`),
};
