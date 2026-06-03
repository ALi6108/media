import { create } from 'zustand';
import { membersApi, CreateMemberPayload, UpdateMemberPayload } from '@/services/members.api';
import { performanceApi } from '@/services/performance.api';

export type Gender = 'Laki-laki' | 'Perempuan';

export interface PerformanceWeek {
  id?: string;
  week: number;
  year: number;
  ikr: number;
  competency: number;
  final: number;
}

export interface Member {
  id: string;
  name: string;
  email: string;
  position: string;
  department: string;
  gender: Gender;
  phone: string;
  joinDate: string;
  photoUrl: string | null;
  avgScore: number;
  avatarInitial: string;
  isActive: boolean;
  performanceHistory: PerformanceWeek[];
}

export type MemberFormData = {
  name: string;
  email: string;
  position: string;
  department: string;
  gender: Gender;
  phone: string;
  joinDate: string;
  photoUrl: string | null;
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function mapGenderFromApi(gender: string | null | undefined, name?: string): Gender {
  if (gender === 'L') return 'Laki-laki';
  if (gender === 'P') return 'Perempuan';
  // Deterministic mock gender based on name if no gender from API is set, to ensure a realistic mix of genders
  if (name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash) % 2 === 0 ? 'Perempuan' : 'Laki-laki';
  }
  return 'Laki-laki';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapMemberFromApi(raw: any): Member {
  const name = raw.full_name || raw.name || '';
  const perfHistory: PerformanceWeek[] = (raw.performances || []).map((p: {
    id?: string;
    week?: number;
    year?: number;
    period_week?: number;
    period_year?: number;
    ikr_score?: number;
    competency_score?: number;
    final_score?: number;
  }) => ({
    id: p.id,
    week: p.week ?? p.period_week ?? 0,
    year: p.year ?? p.period_year ?? new Date().getFullYear(),
    ikr: p.ikr_score || 0,
    competency: p.competency_score || 0,
    final: p.final_score || 0,
  }));

  const avgScore = perfHistory.length > 0
    ? Number((perfHistory.reduce((s, h) => s + h.final, 0) / perfHistory.length).toFixed(1))
    : 0;

  // Retrieve mock gender & photo dari localStorage (backend tidak simpan field ini)
  let savedGender: Gender | null = null;
  let savedPhoto: string | null = null;
  if (typeof window !== 'undefined') {
    const local = localStorage.getItem(`member_gender_${raw.id}`);
    if (local === 'Laki-laki' || local === 'Perempuan') {
      savedGender = local as Gender;
    }
    savedPhoto = localStorage.getItem(`member_photo_${raw.id}`);
  }

  return {
    id: raw.id,
    name,
    email: raw.email || '',
    position: raw.position || '',
    department: raw.division || '',
    gender: savedGender || mapGenderFromApi(raw.gender, name),
    phone: raw.phone || '',
    joinDate: raw.join_date ? raw.join_date.split('T')[0] : '',
    photoUrl: savedPhoto || raw.photo_url || null,
    avgScore,
    avatarInitial: getInitials(name),
    isActive: raw.is_active !== false,
    performanceHistory: perfHistory.sort((a, b) => a.week - b.week),
  };
}

interface MemberState {
  members: Member[];
  isLoading: boolean;
  error: string | null;

  // API-connected actions
  fetchMembers: () => Promise<void>;
  fetchMemberDetail: (id: string) => Promise<Member | null>;
  addMember: (data: MemberFormData) => Promise<Member | null>;
  updateMember: (id: string, data: Partial<MemberFormData>) => Promise<void>;
  deleteMember: (id: string) => Promise<void>;

  // Helpers
  getMember: (id: string) => Member | undefined;
  getMembersByGender: (gender: Gender) => Member[];
}

export const useMemberStore = create<MemberState>()(
  (set, get) => ({
    members: [],
    isLoading: false,
    error: null,

    fetchMembers: async () => {
      set({ isLoading: true, error: null });
      try {
        const membersRes = await membersApi.getAll();
        const rawMembers = membersRes.data || [];
        const members = (Array.isArray(rawMembers) ? rawMembers : []).map(mapMemberFromApi);

        // Enrich members with performance data (non-critical)
        try {
          const perfRes = await performanceApi.getAll({ year: new Date().getFullYear() });
          const rawPerf: Array<{
            id?: string;
            member_id: string;
            period_week?: number;
            period_year?: number;
            ikr_score?: number;
            competency_score?: number;
            final_score?: number;
          }> = perfRes.data || [];

          if (Array.isArray(rawPerf) && rawPerf.length > 0) {
            // Group performance entries by member_id
            const byMember: Record<string, typeof rawPerf> = {};
            for (const p of rawPerf) {
              if (!byMember[p.member_id]) byMember[p.member_id] = [];
              byMember[p.member_id].push(p);
            }

            // Enrich each member
            for (const m of members) {
              const entries = byMember[m.id];
              if (entries && entries.length > 0) {
                entries.sort((a, b) => (a.period_week || 0) - (b.period_week || 0));
                m.performanceHistory = entries.map(p => ({
                  id: p.id,
                  week: p.period_week ?? 0,
                  year: p.period_year ?? new Date().getFullYear(),
                  ikr: p.ikr_score || 0,
                  competency: p.competency_score || 0,
                  final: p.final_score || 0,
                }));
                m.avgScore = Number(
                  (entries.reduce((s, p) => s + (p.final_score || 0), 0) / entries.length).toFixed(1)
                );
              }
            }
          }
        } catch {
          // Performance data tidak tersedia — members tetap bisa ditampilkan
        }

        set({ members, isLoading: false });
      } catch (err) {
        console.error('Failed to fetch members:', err);
        set({ error: 'Gagal memuat data anggota', isLoading: false });
      }
    },

    fetchMemberDetail: async (id: string) => {
      try {
        const res = await membersApi.getById(id);
        const raw = res.data;
        if (!raw) return null;

        const baseMember = mapMemberFromApi(raw);

        // Fetch per-member performance history from API
        let perfData: PerformanceWeek[] = [];
        try {
          const perfRes = await performanceApi.getByMember(id, new Date().getFullYear());
          let perfRaw = perfRes.data || [];
          // Handle response wrapped in object (e.g., { performances: [...] })
          if (!Array.isArray(perfRaw)) {
            perfRaw = perfRaw?.performances || perfRaw?.items || perfRaw?.data || [];
          }
          perfData = (Array.isArray(perfRaw) ? perfRaw : []).map((p: {
            id?: string;
            week?: number;
            year?: number;
            period_week?: number;
            period_year?: number;
            ikr_score?: number;
            competency_score?: number;
            final_score?: number;
          }) => ({
            id: p.id,
            week: p.week ?? p.period_week ?? 0,
            year: p.year ?? p.period_year ?? new Date().getFullYear(),
            ikr: p.ikr_score || 0,
            competency: p.competency_score || 0,
            final: p.final_score || 0,
          }));
        } catch {
          // API gagal
        }
        // Fallback ke data store jika API tidak mengembalikan data
        if (perfData.length === 0) {
          const existing = get().members.find(m => m.id === id);
          if (existing?.performanceHistory?.length) {
            perfData = existing.performanceHistory;
          }
        }

        const sortedHistory = perfData.sort((a, b) => a.week - b.week);
        const avgScore = sortedHistory.length > 0
          ? Number((sortedHistory.reduce((s, h) => s + h.final, 0) / sortedHistory.length).toFixed(1))
          : 0;

        const member: Member = {
          ...baseMember,
          performanceHistory: sortedHistory,
          avgScore,
        };

        // Update in local state
        set(state => ({
          members: state.members.map(m => m.id === id ? member : m),
        }));

        return member;
      } catch (err) {
        console.error('Failed to fetch member detail:', err);
        return null;
      }
    },

    addMember: async (data) => {
      try {
        const payload: CreateMemberPayload = {
          full_name: data.name,
          position: data.position,
          division: data.department,
          email: data.email || undefined,
          phone: data.phone || undefined,
          join_date: data.joinDate || undefined,
        };
        const res = await membersApi.create(payload);
        const raw = res.data?.data || res.data;

        // Save photo & gender ke localStorage (backend tidak simpan field ini)
        if (typeof window !== 'undefined') {
          localStorage.setItem(`member_gender_${raw.id}`, data.gender);
          if (data.photoUrl) {
            localStorage.setItem(`member_photo_${raw.id}`, data.photoUrl);
          }
        }

        const newMember = mapMemberFromApi(raw);

        // Add to local state immediately
        set(state => ({ members: [...state.members, newMember] }));
        return newMember;
      } catch (err) {
        console.error('Failed to add member:', err);
        throw err;
      }
    },

    updateMember: async (id, data) => {
      try {
        const payload: UpdateMemberPayload = {};
        if (data.name !== undefined) payload.full_name = data.name;
        if (data.position !== undefined) payload.position = data.position;
        if (data.email !== undefined) payload.email = data.email;
        if (data.department !== undefined) payload.division = data.department;
        if (data.phone !== undefined) payload.phone = data.phone;
        if (data.joinDate !== undefined) payload.join_date = data.joinDate;

        await membersApi.update(id, payload);

        // Save photo & gender ke localStorage (backend tidak simpan field ini)
        if (typeof window !== 'undefined') {
          if (data.gender !== undefined) {
            localStorage.setItem(`member_gender_${id}`, data.gender);
          }
          if (data.photoUrl !== undefined) {
            if (data.photoUrl) {
              localStorage.setItem(`member_photo_${id}`, data.photoUrl);
            } else {
              localStorage.removeItem(`member_photo_${id}`);
            }
          }
        }

        // Optimistic update local state
        set(state => ({
          members: state.members.map(m => {
            if (m.id !== id) return m;
            const updated = { ...m };
            if (data.name) { updated.name = data.name; updated.avatarInitial = getInitials(data.name); }
            if (data.position !== undefined) updated.position = data.position;
            if (data.email) updated.email = data.email;
            if (data.department) updated.department = data.department;
            if (data.gender) updated.gender = data.gender;
            if (data.phone !== undefined) updated.phone = data.phone;
            if (data.joinDate) updated.joinDate = data.joinDate;
            if (data.photoUrl !== undefined) updated.photoUrl = data.photoUrl;
            return updated;
          }),
        }));
      } catch (err) {
        console.error('Failed to update member:', err);
        throw err;
      }
    },

    deleteMember: async (id) => {
      try {
        await membersApi.delete(id);
        set(state => ({
          members: state.members.filter(m => m.id !== id),
        }));
      } catch (err) {
        console.error('Failed to delete member:', err);
        throw err;
      }
    },

    getMember: (id) => {
      return get().members.find(m => m.id === id);
    },

    getMembersByGender: (gender) => {
      return get().members.filter(m => m.gender === gender);
    },
  })
);
