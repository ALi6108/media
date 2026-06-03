'use client';

import { use } from 'react';
import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { RatingBadge } from '@/components/shared/RatingBadge';
import { useMemberStore, Gender, Member } from '@/store/memberStore';
import { performanceApi } from '@/services/performance.api';
import {
  ArrowLeft, Mail, Calendar, Briefcase, Save, X, Pencil,
  Camera, Loader2, Phone, Trash2, Plus, Check,
} from 'lucide-react';
import { MemberLineChart } from '@/dashboard/MemberLineChart';

export default function MemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { fetchMemberDetail, updateMember, deleteMember } = useMemberStore();
  const memberFromStore = useMemberStore((state) => state.members.find(m => m.id === resolvedParams.id));

  const [member, setMember] = useState<Member | null>(() => memberFromStore ?? null);
  const [mounted, setMounted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditingPerformance, setIsEditingPerformance] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [isLoadingDetail, setIsLoadingDetail] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        <div className="h-10 w-40 bg-slate-200 rounded-lg" />
        <div className="h-48 bg-slate-200 rounded-xl" />
        <div className="h-72 bg-slate-200 rounded-xl" />
      </div>
    );
  }

  if (!effectiveMember) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-400 text-lg">Anggota tidak ditemukan.</p>
        <Link href="/members">
          <Button variant="ghost" className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Daftar
          </Button>
        </Link>
      </div>
    );
  }

  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file && member) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const photoUrl = reader.result as string;
        updateMember(member.id, { photoUrl }).catch(console.error);
        setMember(prev => prev ? { ...prev, photoUrl } : prev);
      };
      reader.readAsDataURL(file);
    }
  }

  async function handleSaveProfile() {
    if (!member) return;
    setIsSaving(true);
    setSaveError('');
    try {
      await updateMember(member.id, editData);
      setMember(prev => prev ? {
        ...prev,
        ...editData,
        avatarInitial: editData.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
      } : prev);

      setIsEditing(false);
    } catch {
      setSaveError('Gagal menyimpan perubahan. Silakan coba lagi.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSavePerformance() {
    if (!effectiveMember) return;
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
    if (!member) return;
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
    ? 'bg-blue-100 text-blue-700'
    : 'bg-pink-100 text-pink-700';

  // Performance history — prefer API data (from fetchMemberDetail) over store fallback
  const perfHistory = member?.performanceHistory?.length
    ? member.performanceHistory
    : memberFromStore?.performanceHistory ?? [];

  return (
    <div className="space-y-6">
      {/* Back + Actions */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <Link href="/members">
          <Button variant="ghost" className="text-slate-500 hover:text-slate-700 -ml-2">
            <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Daftar
          </Button>
        </Link>
        <div className="flex gap-2">
          {!isEditing ? (
            <Button
              onClick={() => setIsEditing(true)}
              variant="outline"
              className="border-blue-200 text-blue-600 hover:bg-blue-50"
            >
              <Pencil className="mr-2 h-4 w-4" /> Edit Profil
            </Button>
          ) : (
            <Button
              onClick={() => setIsEditing(false)}
              variant="outline"
              className="border-slate-200 text-slate-600"
            >
              <X className="mr-2 h-4 w-4" /> Batal Edit
            </Button>
          )}
          <Button
            onClick={handleDeleteMember}
            variant="outline"
            className="border-red-200 text-red-600 hover:bg-red-50"
          >
            <Trash2 className="mr-2 h-4 w-4" /> Hapus
          </Button>
        </div>
      </div>

      {/* Error */}
      {saveError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {saveError}
        </div>
      )}

      {/* Profile Card */}
      <Card className="shadow-md border border-slate-200 overflow-hidden">
        <div className={`h-24 bg-gradient-to-r ${genderColor} relative`}>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDJ2LTJoMzR6bTAtMzBWMEgydjRoMzR6TTIgMjBoMzR2MkgyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
        </div>

        <CardContent className="p-6 -mt-12">
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
            </div>

            {/* Info */}
            <div className="flex-1 space-y-4 w-full mt-4 sm:mt-6">
              {isEditing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">Nama Lengkap</label>
                      <Input
                        value={editData.name}
                        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">Email</label>
                      <Input
                        type="email"
                        value={editData.email}
                        onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">Posisi / Jabatan</label>
                      <Input
                        value={editData.position}
                        onChange={(e) => setEditData({ ...editData, position: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">Divisi</label>
                      <Input
                        value={editData.department}
                        onChange={(e) => setEditData({ ...editData, department: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">No. Telepon</label>
                      <Input
                        value={editData.phone}
                        onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">Tanggal Bergabung</label>
                      <Input
                        type="date"
                        value={editData.joinDate}
                        onChange={(e) => setEditData({ ...editData, joinDate: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">Jenis Kelamin</label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setEditData({ ...editData, gender: 'Laki-laki' })}
                          className={`flex-1 px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                            editData.gender === 'Laki-laki'
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                          }`}
                        >
                          👨 Laki-laki
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditData({ ...editData, gender: 'Perempuan' })}
                          className={`flex-1 px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                            editData.gender === 'Perempuan'
                              ? 'bg-pink-600 text-white border-pink-600'
                              : 'bg-white text-slate-600 border-slate-200 hover:border-pink-300'
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
                      className="bg-blue-600 hover:bg-blue-700"
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
                      <h2 className="text-2xl font-bold text-slate-800">{effectiveMember.name}</h2>
                      <Badge variant="outline" className={`text-xs font-medium ${genderBadgeColor}`}>
                        {effectiveMember.gender === 'Laki-laki' ? '👨' : '👩'} {effectiveMember.gender}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-slate-500">
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
                    <span className="text-sm text-slate-500">Rata-rata Skor:</span>
                    <span className="text-2xl font-bold text-slate-800">{effectiveMember.avgScore}</span>
                    {effectiveMember.avgScore > 0 && <RatingBadge score={effectiveMember.avgScore} showScore={false} />}
                  </div>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <MemberLineChart data={perfHistory} />

      {/* Performance Table — Editable */}
      <Card className="shadow-sm border border-slate-200">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-base font-semibold text-slate-700">Detail Kinerja Mingguan</CardTitle>
            <div className="flex gap-2">
              {!isEditingPerformance ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditPerformance([...perfHistory]);
                    setIsEditingPerformance(true);
                  }}
                  className="border-blue-200 text-blue-600 hover:bg-blue-50"
                >
                  <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit Kinerja
                </Button>
              ) : (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleAddPerformanceWeek}
                    className="border-emerald-200 text-emerald-600 hover:bg-emerald-50"
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
                    className="border-slate-200 text-slate-600"
                  >
                    <X className="mr-1.5 h-3.5 w-3.5" /> Batal
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSavePerformance}
                    disabled={isSaving}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isSaving ? (
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Check className="mr-1.5 h-3.5 w-3.5" />
                    )}
                    Simpan
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-600">Minggu</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600">IKR (60%)</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600">Kompetensi (40%)</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600">Skor Akhir</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600">Rating</th>
                  {isEditingPerformance && (
                    <th className="text-center py-3 px-4 font-semibold text-slate-600 w-16">Aksi</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {isEditingPerformance ? (
                  editPerformance.map((h, idx) => (
                    <tr key={h.id ?? `edit-${idx}`} className="border-b border-slate-100 hover:bg-blue-50/30 transition-colors">
                      <td className="py-2 px-4">
                        <span className="text-sm font-medium text-slate-700">W{h.week}</span>
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
                      <td className="py-2 px-4 font-semibold text-slate-800">
                        {((h.ikr * 0.6) + (h.competency * 0.4)).toFixed(1)}
                      </td>
                      <td className="py-2 px-4">
                        <RatingBadge score={Number(((h.ikr * 0.6) + (h.competency * 0.4)).toFixed(1))} />
                      </td>
                      <td className="py-2 px-4 text-center">
                        <button
                          onClick={() => handleDeletePerformanceWeek(idx)}
                          className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  perfHistory.map((h, idx) => (
                    <tr key={h.id ?? `perf-${idx}`} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-medium text-slate-700">W{h.week}</td>
                      <td className="py-3 px-4 text-slate-600">{h.ikr}</td>
                      <td className="py-3 px-4 text-slate-600">{h.competency}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{h.final}</td>
                      <td className="py-3 px-4"><RatingBadge score={h.final} /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {perfHistory.length === 0 && !isEditingPerformance && (
              <div className="text-center py-8">
                <p className="text-slate-400">Belum ada data kinerja</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2 border-blue-200 text-blue-600"
                  onClick={() => {
                    setEditPerformance([]);
                    setIsEditingPerformance(true);
                  }}
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" /> Tambah Data Kinerja
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
