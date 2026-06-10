'use client';

import { use } from 'react';
import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { RatingBadge } from '@/components/shared/RatingBadge';
import { useMemberStore, Gender, Member } from '@/store/memberStore';
import { useAuthStore } from '@/store/authStore';
import { performanceApi } from '@/services/performance.api';
import { membersApi } from '@/services/members.api';
import {
  ArrowLeft, Mail, Calendar, Briefcase, Save, X, Pencil,
  Camera, Loader2, Phone, Trash2, Plus, Check,
} from 'lucide-react';
import { MemberLineChart } from '@/dashboard/MemberLineChart';

export default function MemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { fetchMemberDetail, updateMember, deleteMember, fetchMembers } = useMemberStore();
  const memberFromStore = useMemberStore((state) => state.members.find(m => m.id === resolvedParams.id));

  const [member, setMember] = useState<Member | null>(() => memberFromStore ?? null);
  const [mounted, setMounted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditingPerformance, setIsEditingPerformance] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [isLoadingDetail, setIsLoadingDetail] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user: authUser } = useAuthStore();
  const isAdmin = authUser?.role === 'ADMIN';

  // Edit form state
  const [editData, setEditData] = useState({
    name: '',
    email: '',
    position: '',
    department: '',
    gender: 'Laki-laki' as Gender,
    phone: '',
    joinDate: '',
  });

  // Performance edit state
  const [editPerformance, setEditPerformance] = useState<Array<{
    id?: string;
    week: number;
    year: number;
    ikr: number;
    competency: number;
    final: number;
  }>>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch member detail from API
  const loadMember = useCallback(async () => {
    setIsLoadingDetail(true);
    const detail = await fetchMemberDetail(resolvedParams.id);
    if (detail) {
      setMember(detail);
      setEditData({
        name: detail.name,
        email: detail.email,
        position: detail.position,
        department: detail.department,
        gender: detail.gender,
        phone: detail.phone,
        joinDate: detail.joinDate,
      });
      setEditPerformance([...detail.performanceHistory]);
    }
    setIsLoadingDetail(false);
  }, [resolvedParams.id, fetchMemberDetail]);

  useEffect(() => {
    loadMember();
  }, [loadMember]);

  // Use store data if local state is still loading
  const effectiveMember = member ?? memberFromStore ?? null;

  if (!mounted || (!effectiveMember && isLoadingDetail)) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-10 w-40 bg-white/10 rounded-lg" />
        <div className="h-48 bg-white/10 rounded-xl" />
        <div className="h-72 bg-white/10 rounded-xl" />
      </div>
    );
  }

  if (!effectiveMember) {
    return (
      <div className="text-center py-20">
        <p className="text-[var(--galactic-diamond)]/60 text-lg">Anggota tidak ditemukan.</p>
        <Link href="/members">
          <Button variant="ghost" className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Daftar
          </Button>
        </Link>
      </div>
    );
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file && member && isAdmin) {
      try {
        const res = await membersApi.uploadPhoto(member.id, file);
        const updated = res.data;
        const newPhotoUrl = updated.photo_url || updated.photoUrl || null;
        if (newPhotoUrl && typeof window !== 'undefined') {
          localStorage.setItem(`member_photo_${member.id}`, newPhotoUrl);
        }
        setMember(prev => prev ? { ...prev, photoUrl: newPhotoUrl } : prev);
        await fetchMembers();
      } catch (err) {
        console.error('Failed to upload photo:', err);
        setSaveError('Gagal mengupload foto. Silakan coba lagi.');
      }
    }
  }

  async function handleSaveProfile() {
    if (!member || !isAdmin) return;
    setIsSaving(true);
    setSaveError('');
    try {
      await updateMember(member.id, editData);
      await loadMember();
      setIsEditing(false);
    } catch {
      setSaveError('Gagal menyimpan perubahan. Silakan coba lagi.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSavePerformance() {
    if (!effectiveMember || !isAdmin) return;
    setIsSaving(true);
    setSaveError('');
    try {
      // For existing entries, update. For new entries, create.
      for (const entry of editPerformance) {
        const ikrScore = entry.ikr;
        const compScore = entry.competency;

        if (entry.id) {
          // Update existing
          await performanceApi.update(entry.id, {
            ikr_score: ikrScore,
            competency_score: compScore,
          });
        } else {
          // Create new
          await performanceApi.create({
            member_id: effectiveMember.id,
            period_year: entry.year || new Date().getFullYear(),
            period_week: entry.week,
            ikr_score: ikrScore,
            competency_score: compScore,
          });
        }
      }

      // Refresh member detail
      await loadMember();
      setIsEditingPerformance(false);
    } catch {
      setSaveError('Gagal menyimpan data kinerja. Silakan coba lagi.');
    } finally {
      setIsSaving(false);
    }
  }

  function handleAddPerformanceWeek() {
    const nextWeek = editPerformance.length > 0
      ? Math.max(...editPerformance.map(p => p.week)) + 1
      : 1;
    setEditPerformance([...editPerformance, {
      week: nextWeek,
      year: new Date().getFullYear(),
      ikr: 0,
      competency: 0,
      final: 0,
    }]);
  }

  function handleDeletePerformanceWeek(index: number) {
    if (!isAdmin) return;
    const entry = editPerformance[index];
    if (entry.id) {
      // Delete from API
      performanceApi.delete(entry.id).catch(console.error);
    }
    setEditPerformance(editPerformance.filter((_, i) => i !== index));
  }

  function handlePerformanceChange(index: number, field: 'ikr' | 'competency', value: number) {
    const updated = [...editPerformance];
    updated[index] = { ...updated[index], [field]: value };
    updated[index].final = Number(((updated[index].ikr * 0.6) + (updated[index].competency * 0.4)).toFixed(1));
    setEditPerformance(updated);
  }

  async function handleDeleteMember() {
    if (!member || !isAdmin) return;
    if (confirm('Apakah Anda yakin ingin menghapus anggota ini?')) {
      try {
        await deleteMember(member.id);
        router.push('/members');
      } catch {
        setSaveError('Gagal menghapus anggota.');
      }
    }
  }

  const genderColor = effectiveMember.gender === 'Laki-laki' ? 'from-blue-500 to-indigo-600' : 'from-pink-500 to-rose-600';
  const genderBadgeColor = effectiveMember.gender === 'Laki-laki'
    ? 'bg-[var(--galactic-aurora)]/10 text-[var(--galactic-aurora)]'
    : 'bg-[var(--galactic-rose)]/10 text-[var(--galactic-rose)]';

  // Performance history — prefer API data (from fetchMemberDetail) over store fallback
  const perfHistory = member?.performanceHistory?.length
    ? member.performanceHistory
    : memberFromStore?.performanceHistory ?? [];

  return (
    <div className="space-y-6">
      {/* Back + Actions */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <Link href="/members">
          <Button variant="ghost" className="text-[var(--galactic-diamond)]/80 hover:text-[var(--galactic-diamond)] -ml-2">
            <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Daftar
          </Button>
        </Link>
        <div className="flex gap-2">
          {isAdmin && !isEditing ? (
            <Button
              onClick={() => setIsEditing(true)}
              variant="outline"
              className="border-[var(--galactic-aurora)]/20 text-[var(--galactic-aurora)] hover:bg-[var(--galactic-aurora)]/10"
            >
              <Pencil className="mr-2 h-4 w-4" /> Edit Profil
            </Button>
          ) : isEditing ? (
            <Button
              onClick={() => setIsEditing(false)}
              variant="outline"
              className="border-white/10 text-[var(--galactic-diamond)]/80"
            >
              <X className="mr-2 h-4 w-4" /> Batal Edit
            </Button>
          ) : null}
          {isAdmin && (
            <Button
              onClick={handleDeleteMember}
              variant="outline"
              className="border-[var(--galactic-rose)]/20 text-[var(--galactic-rose)] hover:bg-[var(--galactic-rose)]/10"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Hapus
            </Button>
          )}
        </div>
      </div>

      {/* Error */}
      {saveError && (
        <div className="p-3 bg-[var(--galactic-rose)]/10 border border-[var(--galactic-rose)]/20 rounded-lg text-[var(--galactic-rose)] text-sm">
          {saveError}
        </div>
      )}

      {/* Profile Card */}
      <GlassCard className="shadow-md border border-white/10 overflow-hidden">
        <div className={`h-24 bg-gradient-to-r ${genderColor} relative`}>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDJ2LTJoMzR6bTAtMzBWMEgydjRoMzR6TTIgMjBoMzR2MkgyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
        </div>

        <GlassCardContent className="p-6 -mt-12">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            {/* Avatar / Photo */}
            <div className="relative group">
              {effectiveMember.photoUrl ? (
                <div className="w-24 h-24 rounded-2xl overflow-hidden ring-4 ring-white shadow-xl">
                  <img src={effectiveMember.photoUrl} alt={effectiveMember.name} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className={`w-24 h-24 rounded-2xl bg-gradient-to-br ${genderColor} flex items-center justify-center text-white text-2xl font-bold shadow-xl ring-4 ring-white`}>
                  {effectiveMember.avatarInitial}
                </div>
              )}
              {isAdmin && (
                <>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 w-24 h-24 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    <Camera className="h-6 w-6 text-white" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                </>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 space-y-4 w-full mt-4 sm:mt-6">
              {isEditing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-[var(--galactic-diamond)]">Nama Lengkap</label>
                      <Input
                        value={editData.name}
                        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-[var(--galactic-diamond)]">Email</label>
                      <Input
                        type="email"
                        value={editData.email}
                        onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-[var(--galactic-diamond)]">Posisi / Jabatan</label>
                      <Input
                        value={editData.position}
                        onChange={(e) => setEditData({ ...editData, position: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-[var(--galactic-diamond)]">Divisi</label>
                      <Input
                        value={editData.department}
                        onChange={(e) => setEditData({ ...editData, department: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-[var(--galactic-diamond)]">No. Telepon</label>
                      <Input
                        value={editData.phone}
                        onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-[var(--galactic-diamond)]">Tanggal Bergabung</label>
                      <Input
                        type="date"
                        value={editData.joinDate}
                        onChange={(e) => setEditData({ ...editData, joinDate: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-[var(--galactic-diamond)]">Jenis Kelamin</label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setEditData({ ...editData, gender: 'Laki-laki' })}
                          className={`flex-1 px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                            editData.gender === 'Laki-laki'
                              ? 'bg-[var(--galactic-aurora)] text-white border-blue-600'
                              : 'bg-white/5 text-[var(--galactic-diamond)]/80 border-white/10 hover:border-[var(--galactic-aurora)]/30'
                          }`}
                        >
                          👨 Laki-laki
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditData({ ...editData, gender: 'Perempuan' })}
                          className={`flex-1 px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                            editData.gender === 'Perempuan'
                              ? 'bg-[var(--galactic-rose)] text-white border-pink-600'
                              : 'bg-white/5 text-[var(--galactic-diamond)]/80 border-white/10 hover:border-[var(--galactic-rose)]/30'
                          }`}
                        >
                          👩 Perempuan
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <Button onClick={() => setIsEditing(false)} variant="outline">
                      Batal
                    </Button>
                    <Button
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      className="bg-[var(--galactic-aurora)] hover:bg-[var(--galactic-cosmic)]"
                    >
                      {isSaving ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...</>
                      ) : (
                        <><Save className="mr-2 h-4 w-4" /> Simpan Perubahan</>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-2xl font-bold text-[var(--galactic-diamond)]">{effectiveMember.name}</h2>
                      <Badge variant="outline" className={`text-xs font-medium ${genderBadgeColor}`}>
                        {effectiveMember.gender === 'Laki-laki' ? '👨' : '👩'} {effectiveMember.gender}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-[var(--galactic-diamond)]/80">
                      <span className="flex items-center gap-1.5">
                        <Briefcase className="h-4 w-4" />{effectiveMember.position} · {effectiveMember.department}
                      </span>
                      {effectiveMember.email && (
                        <span className="flex items-center gap-1.5">
                          <Mail className="h-4 w-4" />{effectiveMember.email}
                        </span>
                      )}
                      {effectiveMember.phone && (
                        <span className="flex items-center gap-1.5">
                          <Phone className="h-4 w-4" />{effectiveMember.phone}
                        </span>
                      )}
                      {effectiveMember.joinDate && (
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4" />Bergabung: {effectiveMember.joinDate}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-[var(--galactic-diamond)]/80">Rata-rata Skor:</span>
                    <span className="text-2xl font-bold text-[var(--galactic-diamond)]">{effectiveMember.avgScore}</span>
                    {effectiveMember.avgScore > 0 && <RatingBadge score={effectiveMember.avgScore} showScore={false} />}
                  </div>
                </>
              )}
            </div>
          </div>
        </GlassCardContent>
      </GlassCard>

      <MemberLineChart data={perfHistory} />

      {/* Performance Table — Editable */}
      <GlassCard className="shadow-[0_0_15px_rgba(255,255,255,0.05)] border border-white/10">
        <GlassCardHeader className="pb-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <GlassCardTitle className="text-base font-semibold text-[var(--galactic-diamond)]">Detail Kinerja Mingguan</GlassCardTitle>
            <div className="flex gap-2">
              {isAdmin && !isEditingPerformance ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditPerformance([...perfHistory]);
                    setIsEditingPerformance(true);
                  }}
                  className="border-[var(--galactic-aurora)]/20 text-[var(--galactic-aurora)] hover:bg-[var(--galactic-aurora)]/10"
                >
                  <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit Kinerja
                </Button>
              ) : isEditingPerformance ? (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleAddPerformanceWeek}
                    className="border-[var(--galactic-emerald)]/20 text-[var(--galactic-emerald)] hover:bg-[var(--galactic-emerald)]/10"
                  >
                    <Plus className="mr-1.5 h-3.5 w-3.5" /> Tambah Minggu
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditPerformance([...perfHistory]);
                      setIsEditingPerformance(false);
                    }}
className="border-white/10 text-[var(--galactic-diamond)]/80"
                  >
                    <X className="mr-1.5 h-3.5 w-3.5" /> Batal
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSavePerformance}
                    disabled={isSaving}
                    className="bg-[var(--galactic-aurora)] hover:bg-[var(--galactic-cosmic)]"
                  >
                    {isSaving ? (
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Check className="mr-1.5 h-3.5 w-3.5" />
                    )}
                    Simpan
                  </Button>
                </>
              ) : null}
            </div>
          </div>
        </GlassCardHeader>
        <GlassCardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 font-semibold text-[var(--galactic-diamond)]/80">Minggu</th>
                  <th className="text-left py-3 px-4 font-semibold text-[var(--galactic-diamond)]/80">IKR (60%)</th>
                  <th className="text-left py-3 px-4 font-semibold text-[var(--galactic-diamond)]/80">Kompetensi (40%)</th>
                  <th className="text-left py-3 px-4 font-semibold text-[var(--galactic-diamond)]/80">Skor Akhir</th>
                  <th className="text-left py-3 px-4 font-semibold text-[var(--galactic-diamond)]/80">Rating</th>
                  {isEditingPerformance && (
                    <th className="text-center py-3 px-4 font-semibold text-[var(--galactic-diamond)]/80 w-16">Aksi</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {isEditingPerformance ? (
                  editPerformance.map((h, idx) => (
                    <tr key={h.id ?? `edit-${idx}`} className="border-b border-white/5 hover:bg-[var(--galactic-aurora)]/10/30 transition-colors">
                      <td className="py-2 px-4">
                        <span className="text-sm font-medium text-[var(--galactic-diamond)]">W{h.week}</span>
                      </td>
                      <td className="py-2 px-4">
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={h.ikr}
                          onChange={(e) => handlePerformanceChange(idx, 'ikr', Number(e.target.value))}
                          className="w-20 h-8 text-sm"
                        />
                      </td>
                      <td className="py-2 px-4">
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={h.competency}
                          onChange={(e) => handlePerformanceChange(idx, 'competency', Number(e.target.value))}
                          className="w-20 h-8 text-sm"
                        />
                      </td>
                      <td className="py-2 px-4 font-semibold text-[var(--galactic-diamond)]">
                        {((h.ikr * 0.6) + (h.competency * 0.4)).toFixed(1)}
                      </td>
                      <td className="py-2 px-4">
                        <RatingBadge score={Number(((h.ikr * 0.6) + (h.competency * 0.4)).toFixed(1))} />
                      </td>
                      <td className="py-2 px-4 text-center">
                        <button
                          onClick={() => handleDeletePerformanceWeek(idx)}
                          className="p-1 text-red-400 hover:text-[var(--galactic-rose)] hover:bg-[var(--galactic-rose)]/10 rounded transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  perfHistory.map((h, idx) => (
                    <tr key={h.id ?? `perf-${idx}`} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4 font-medium text-[var(--galactic-diamond)]">W{h.week}</td>
                      <td className="py-3 px-4 text-[var(--galactic-diamond)]/80">{h.ikr}</td>
                      <td className="py-3 px-4 text-[var(--galactic-diamond)]/80">{h.competency}</td>
                      <td className="py-3 px-4 font-semibold text-[var(--galactic-diamond)]">{h.final}</td>
                      <td className="py-3 px-4"><RatingBadge score={h.final} /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {perfHistory.length === 0 && !isEditingPerformance && (
              <div className="text-center py-8">
                <p className="text-[var(--galactic-diamond)]/60">Tidak ada data kinerja</p>
                {isAdmin && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2 border-[var(--galactic-aurora)]/20 text-[var(--galactic-aurora)]"
                    onClick={() => {
                      setEditPerformance([]);
                      setIsEditingPerformance(true);
                    }}
                  >
                    <Plus className="mr-1.5 h-3.5 w-3.5" /> Tambah Data Kinerja
                  </Button>
                )}
              </div>
            )}
          </div>
        </GlassCardContent>
      </GlassCard>
    </div>
  );
}
