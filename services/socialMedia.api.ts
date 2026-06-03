import api from '@/lib/axios';

export const socialMediaApi = {
  getAll: (params?: { week?: number; year?: number; platform?: string; account_name?: string }) =>
    api.get('/api/v1/social-media', { params }),

  getById: (id: string) =>
    api.get(`/api/v1/social-media/${id}`),

  create: (data: {
    platform: 'INSTAGRAM' | 'TIKTOK' | 'YOUTUBE' | 'FACEBOOK' | 'TWITTER' | 'BLOG';
    account_name?: string;
    followers_count: number; total_posts: number; total_reach?: number;
    total_impressions?: number; engagement_rate?: number;
    profile_url?: string; screenshot_url?: string;
    period_week: number; period_year: number;
  }) => api.post('/api/v1/social-media', data),

  update: (id: string, data: {
    followers_count: number; total_posts: number; total_reach?: number;
    total_impressions?: number; engagement_rate?: number;
  }) => api.patch(`/api/v1/social-media/${id}`, data),

  delete: (id: string) =>
    api.delete(`/api/v1/social-media/${id}`),

  getSummary: (year: number, week: number) =>
    api.get('/api/v1/social-media/summary', { params: { year, week } }),

  getTrend: (year: number, platform?: string, account_name?: string) =>
    api.get('/api/v1/social-media/trend', { params: { year, platform, account_name } }),
};
