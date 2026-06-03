import api from '@/lib/axios';

export const authApi = {
  login: (data: { email: string; password: string }) =>
    api.post('/api/v1/auth/login', data),

  refresh: (refreshToken: string) =>
    api.post('/api/v1/auth/refresh', { refresh_token: refreshToken }),

  me: () =>
    api.get('/api/v1/auth/me'),

  logout: () =>
    api.post('/api/v1/auth/logout'),
};
