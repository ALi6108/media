import api from '@/lib/axios';

export const performanceApi = {
  getAll: (params?: { year?: number; week?: number; member_id?: string; division?: string; page?: number; limit?: number }) =>
    api.get('/api/v1/performance', { params }),

  getByMember: (memberId: string, year?: number) =>
    api.get(`/api/v1/performance/members/${memberId}`, { params: { year } }),

  create: (data: { member_id: string; period_week: number; period_year: number; ikr_score: number; competency_score: number; notes?: string; evidence_url?: string; is_event_period?: boolean; event_id?: string }) =>
    api.post('/api/v1/performance', data),

  createBatch: (data: {
    period_week: number;
    period_year: number;
    entries: Array<{
      member_id: string;
      ikr_score: number;
      competency_score: number;
      notes?: string;
      evidence_url?: string;
    }>;
  }) =>
    api.post('/api/v1/performance/batch', data),

  update: (id: string, data: { ikr_score?: number; competency_score?: number; notes?: string; evidence_url?: string; is_event_period?: boolean; event_id?: string }) =>
    api.patch(`/api/v1/performance/${id}`, data),

  delete: (id: string) =>
    api.delete(`/api/v1/performance/${id}`),

  getSummary: (year: number, week: number) =>
    api.get('/api/v1/performance/summary', { params: { year, week } }),

  getTrend: (year: number, memberId?: string) =>
    api.get('/api/v1/performance/trend', { params: { year, ...(memberId && { member_id: memberId }) } }),
};
