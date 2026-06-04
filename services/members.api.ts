import api from '@/lib/axios';

export interface CreateMemberPayload {
  full_name: string;
  position: string;
  division: string;
  email?: string;
  phone?: string;
  join_date?: string;
  photo_url?: string;
  gender?: string;
}

export interface UpdateMemberPayload {
  full_name?: string;
  position?: string;
  division?: string;
  email?: string;
  phone?: string;
  join_date?: string;
  photo_url?: string;
  gender?: string;
}

export const membersApi = {
  getAll: (params?: { division?: string; include_inactive?: boolean }) =>
    api.get('/api/v1/members', { params }),

  getById: (id: string) =>
    api.get(`/api/v1/members/${id}`),

  create: (data: CreateMemberPayload) =>
    api.post('/api/v1/members', data),

  update: (id: string, data: UpdateMemberPayload) =>
    api.patch(`/api/v1/members/${id}`, data),

  delete: (id: string) =>
    api.delete(`/api/v1/members/${id}`),

  toggleActive: (id: string) =>
    api.patch(`/api/v1/members/${id}/toggle-active`),
};
