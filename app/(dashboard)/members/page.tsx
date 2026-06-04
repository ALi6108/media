'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { GlassCard, GlassCardContent } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { RatingBadge } from '@/components/shared/RatingBadge';
import { useAuthStore } from '@/store/authStore';
import { useMemberStore, Gender, Member } from '@/store/memberStore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Search, UserPlus, Mail, ChevronRight, Users, Camera,
  X, Save, Loader2, Phone, RefreshCw, SlidersHorizontal,
  ArrowDownAZ, ArrowUpZA, Briefcase, TrendingUp, RotateCcw, Check,
} from 'lucide-react';

// === Filter Types ===
type SortOrder = 'none' | 'asc' | 'desc';
type KinerjaFilter = 'all' | 'sangat-baik' | 'baik' | 'cukup' | 'kurang';

const kinerjaOptions: { value: KinerjaFilter; label: string; emoji: string; color: string; activeColor: string }[] = [
  { value: 'all', label: 'Semua', emoji: '📊', color: 'text-[var(--galactic-diamond)]/60 border-white/10 bg-white/5 hover:border-white/10', activeColor: 'bg-[var(--galactic-obsidian)] text-[var(--galactic-platinum)] border-[var(--galactic-obsidian)] shadow-lg shadow-black/40' },
  { value: 'sangat-baik', label: 'Sangat Baik', emoji: '🌟', color: 'text-[var(--galactic-emerald)] border-[var(--galactic-emerald)]/20 bg-[var(--galactic-emerald)]/10 hover:border-[var(--galactic-emerald)]/30', activeColor: 'bg-[var(--galactic-emerald)] text-white border-emerald-600 shadow-md shadow-emerald-500/25' },
  { value: 'baik', label: 'Baik', emoji: '✅', color: 'text-[var(--galactic-aurora)] border-[var(--galactic-aurora)]/20 bg-[var(--galactic-aurora)]/10 hover:border-[var(--galactic-aurora)]/30', activeColor: 'bg-[var(--galactic-aurora)] text-white border-[var(--galactic-aurora)] shadow-md shadow-[var(--galactic-aurora)]/25' },
  { value: 'cukup', label: 'Cukup', emoji: '⚡', color: 'text-[var(--galactic-amber)] border-[var(--galactic-amber)]/20 bg-[var(--galactic-amber)]/10 hover:border-[var(--galactic-amber)]/30', activeColor: 'bg-[var(--galactic-amber)]/100 text-white border-amber-500 shadow-md shadow-amber-500/25' },
  { value: 'kurang', label: 'Kurang', emoji: '📉', color: 'text-[var(--galactic-rose)] border-[var(--galactic-rose)]/20 bg-[var(--galactic-rose)]/10 hover:border-[var(--galactic-rose)]/30', activeColor: 'bg-[var(--galactic-rose)]/100 text-white border-red-500 shadow-md shadow-red-500/25' },
];

function matchKinerja(score: number): KinerjaFilter {
  if (score >= 90) return 'sangat-baik';
  if (score >= 75) return 'baik';
  if (score >= 60) return 'cukup';
  return 'kurang';
}

const avatarColors = [
  'bg-[var(--galactic-aurora)]/100', 'bg-[var(--galactic-cosmic)]', 'bg-[var(--galactic-aurora-soft)]',
  'bg-[var(--galactic-rose)]/100', 'bg-teal-500', 'bg-[var(--galactic-emerald)]/100',
  'bg-[var(--galactic-rose)]/70', 'bg-cyan-500',
];

const genderTabs: { label: string; value: Gender | 'all'; icon: string }[] = [
  { label: 'Semua', value: 'all', icon: '👥' },
  { label: 'Laki-laki', value: 'Laki-laki', icon: '👨' },
  { label: 'Perempuan', value: 'Perempuan', icon: '👩' },
];

export default function MembersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<Gender | 'all'>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const { user } = useAuthStore();
  const { members, isLoading, error, fetchMembers, addMember } = useMemberStore();
  const isAdmin = user?.role === 'ADMIN';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // === Filter state ===
  const [sortOrder, setSortOrder] = useState<SortOrder>('none');
  const [jabatanFilter, setJabatanFilter] = useState<string>('all');
  const [kinerjaFilter, setKinerjaFilter] = useState<KinerjaFilter>('all');
  const [filterOpen, setFilterOpen] = useState(false);

  // Extract unique positions from members for Jabatan filter
  const uniquePositions = useMemo(() => {
    const positions = new Set<string>();
    members.forEach(m => {
      if (m.position && m.position.trim()) {
        positions.add(m.position.trim());
      }
    });
    return Array.from(positions).sort();
  }, [members]);

  // Count active filters
  const activeFilterCount = [sortOrder !== 'none', jabatanFilter !== 'all', kinerjaFilter !== 'all'].filter(Boolean).length;

  function resetFilters() {
    setSortOrder('none');
    setJabatanFilter('all');
    setKinerjaFilter('all');
  }

  // Add form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    position: '',
    department: '',
    gender: 'Laki-laki' as Gender,
    phone: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Fetch members on mount
  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // === Apply all filters ===
  const filtered = useMemo(() => {
    let result = members.filter(m => {
      const matchSearch =
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.department.toLowerCase().includes(searchQuery.toLowerCase());
      const matchGender = activeTab === 'all' || m.gender === activeTab;
      const matchJabatan = jabatanFilter === 'all' || m.position === jabatanFilter;
      const matchKinerjaFilter = kinerjaFilter === 'all' || matchKinerja(m.avgScore) === kinerjaFilter;
      return matchSearch && matchGender && matchJabatan && matchKinerjaFilter;
    });

    // Apply sort
    if (sortOrder === 'asc') {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name, 'id'));
    } else if (sortOrder === 'desc') {
      result = [...result].sort((a, b) => b.name.localeCompare(a.name, 'id'));
    }

    return result;
  }, [members, searchQuery, activeTab, jabatanFilter, kinerjaFilter, sortOrder]);

  const maleCount = members.filter(m => m.gender === 'Laki-laki').length;
  const femaleCount = members.filter(m => m.gender === 'Perempuan').length;

  function validateForm() {
    const errors: Record<string, string> = {};
    if (!formData.name || formData.name.length < 2) errors.name = 'Nama minimal 2 karakter';
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) errors.email = 'Email tidak valid';
    if (!formData.position) errors.position = 'Posisi wajib diisi';
    if (!formData.department) errors.department = 'Divisi wajib diisi';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  async function handleAddMember() {
    if (!validateForm()) return;
    setIsAdding(true);
    setAddError('');

    try {
      await addMember({
        name: formData.name,
        email: formData.email,
        position: formData.position,
        department: formData.department,
        gender: formData.gender,
        phone: formData.phone,
        joinDate: new Date().toISOString().split('T')[0],
        photoUrl: photoPreview,
      });

      // Reset
      setFormData({ name: '', email: '', position: '', department: '', gender: 'Laki-laki', phone: '' });
      setPhotoPreview(null);
      setFormErrors({});
      setShowAddForm(false);
    } catch {
      setAddError('Gagal menambahkan anggota. Silakan coba lagi.');
    } finally {
      setIsAdding(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-heading font-bold text-[var(--galactic-diamond)]">Anggota Tim</h2>
          <p className="text-[var(--galactic-diamond)]/80 text-sm mt-1">
            {members.length} anggota terdaftar &middot;{' '}
            <span className="text-[var(--galactic-aurora)]">{maleCount} Laki-laki</span> &middot;{' '}
            <span className="text-[var(--galactic-rose)]">{femaleCount} Perempuan</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => fetchMembers()}
            disabled={isLoading}
            className="border-white/10"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          {isAdmin && (
            <Button
              className="bg-[var(--galactic-aurora)] hover:bg-[var(--galactic-cosmic)] shadow-lg shadow-[var(--galactic-aurora)]/25 transition-all duration-200"
              onClick={() => setShowAddForm(!showAddForm)}
            >
              {showAddForm ? (
                <><X className="mr-2 h-4 w-4" /> Batal</>
              ) : (
                <><UserPlus className="mr-2 h-4 w-4" /> Tambah Anggota</>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-[var(--galactic-rose)]/10 border border-[var(--galactic-rose)]/20 rounded-xl text-[var(--galactic-rose)] text-sm">
          {error}
          <Button size="sm" variant="ghost" className="ml-2 text-[var(--galactic-rose)]" onClick={() => fetchMembers()}>
            Coba Lagi
          </Button>
        </div>
      )}

      {/* Quick Add Form - Inline */}
      {showAddForm && (
        <GlassCard className="shadow-lg border-2 border-[var(--galactic-aurora)]/20 animate-in slide-in-from-top-2 duration-300">
          <GlassCardContent className="p-6">
            <h3 className="text-lg font-semibold text-[var(--galactic-diamond)] mb-4 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[var(--galactic-aurora)] flex items-center justify-center">
                <UserPlus className="h-4 w-4 text-white" />
              </div>
              Tambah Anggota Baru
            </h3>

            {addError && (
              <div className="mb-4 p-3 bg-[var(--galactic-rose)]/10 border border-[var(--galactic-rose)]/20 rounded-lg text-[var(--galactic-rose)] text-sm">
                {addError}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Photo Upload */}
              <div className="flex flex-col items-center gap-3 md:row-span-2">
                <div
                  className="w-28 h-28 rounded-2xl border-2 border-dashed border-white/10 hover:border-[var(--galactic-aurora-soft)] flex items-center justify-center cursor-pointer transition-colors overflow-hidden bg-white/5"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center">
                      <Camera className="h-8 w-8 text-[var(--galactic-diamond)]/60 mx-auto" />
                      <span className="text-xs text-[var(--galactic-diamond)]/60 mt-1 block">Upload Foto</span>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
                {photoPreview && (
                  <button
                    onClick={() => setPhotoPreview(null)}
                    className="text-xs text-[var(--galactic-rose)] hover:text-[var(--galactic-rose)]"
                  >
                    Hapus Foto
                  </button>
                )}
              </div>

              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[var(--galactic-diamond)]">Nama Lengkap *</label>
                <Input
                  placeholder="Masukkan nama lengkap"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={formErrors.name ? 'border-red-400' : ''}
                />
                {formErrors.name && <p className="text-xs text-[var(--galactic-rose)]">{formErrors.name}</p>}
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[var(--galactic-diamond)]">Email</label>
                <Input
                  type="email"
                  placeholder="email@media.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={formErrors.email ? 'border-red-400' : ''}
                />
                {formErrors.email && <p className="text-xs text-[var(--galactic-rose)]">{formErrors.email}</p>}
              </div>

              {/* Position */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[var(--galactic-diamond)]">Posisi / Jabatan *</label>
                <Input
                  placeholder="Contoh: Content Creator"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  className={formErrors.position ? 'border-red-400' : ''}
                />
                {formErrors.position && <p className="text-xs text-[var(--galactic-rose)]">{formErrors.position}</p>}
              </div>

              {/* Department */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[var(--galactic-diamond)]">Divisi *</label>
                <Input
                  placeholder="Contoh: Media Sosial"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className={formErrors.department ? 'border-red-400' : ''}
                />
                {formErrors.department && <p className="text-xs text-[var(--galactic-rose)]">{formErrors.department}</p>}
              </div>

              {/* Gender */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[var(--galactic-diamond)]">Jenis Kelamin</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, gender: 'Laki-laki' })}
                    className={`flex-1 px-4 py-2 rounded-lg border text-sm font-medium transition-all duration-200 ${
                      formData.gender === 'Laki-laki'
                        ? 'bg-[var(--galactic-aurora)] text-white border-[var(--galactic-aurora)] shadow-md'
                        : 'bg-white/5 text-[var(--galactic-diamond)]/60 border-white/10 hover:border-[var(--galactic-aurora)]/30'
                    }`}
                  >
                    👨 Laki-laki
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, gender: 'Perempuan' })}
                    className={`flex-1 px-4 py-2 rounded-lg border text-sm font-medium transition-all duration-200 ${
                      formData.gender === 'Perempuan'
                        ? 'bg-[var(--galactic-rose)] text-white border-pink-600 shadow-md'
                        : 'bg-white/5 text-[var(--galactic-diamond)]/60 border-white/10 hover:border-[var(--galactic-rose)]/30'
                    }`}
                  >
                    👩 Perempuan
                  </button>
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[var(--galactic-diamond)]">No. Telepon</label>
                <Input
                  placeholder="08xxxxxxxxxx"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/10">
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Batal
              </Button>
              <Button
                onClick={handleAddMember}
                disabled={isAdding}
                className="bg-[var(--galactic-aurora)] hover:bg-[var(--galactic-cosmic)] shadow-md"
              >
                {isAdding ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...</>
                ) : (
                  <><Save className="mr-2 h-4 w-4" /> Simpan Anggota</>
                )}
              </Button>
            </div>
          </GlassCardContent>
        </GlassCard>
      )}

      {/* Search + Filter + Gender Tabs */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--galactic-diamond)]/60" />
          <Input
            placeholder="Cari nama atau divisi..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filter Button */}
        <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
          <DialogTrigger
            render={
              <button
                id="filter-toggle-btn"
                className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all duration-300 ${
                  activeFilterCount > 0
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-[var(--galactic-aurora)] shadow-lg shadow-[var(--galactic-aurora)]/25 hover:shadow-blue-500/40'
                    : 'bg-white/5 text-[var(--galactic-diamond)]/60 border-white/10 hover:border-[var(--galactic-aurora)]/30 hover:text-[var(--galactic-aurora)] hover:shadow-md'
                }`}
              />
            }
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filter
            {activeFilterCount > 0 && (
              <span className="flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full bg-white/5 text-[var(--galactic-aurora)] shadow-[0_0_15px_rgba(255,255,255,0.05)]">
                {activeFilterCount}
              </span>
            )}
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md">
                  <SlidersHorizontal className="h-4 w-4 text-white" />
                </div>
                Filter & Urutkan
              </DialogTitle>
              <DialogDescription>Atur tampilan daftar anggota tim</DialogDescription>
            </DialogHeader>

            <div className="space-y-5 py-2">
              {/* === Abjad (Sort) === */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <ArrowDownAZ className="h-4 w-4 text-[var(--galactic-aurora-soft)]" />
                  <h4 className="text-sm font-semibold text-[var(--galactic-diamond)]">Abjad</h4>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'none' as SortOrder, label: 'Default', icon: null },
                    { value: 'asc' as SortOrder, label: 'A → Z', icon: <ArrowDownAZ className="h-3.5 w-3.5" /> },
                    { value: 'desc' as SortOrder, label: 'Z → A', icon: <ArrowUpZA className="h-3.5 w-3.5" /> },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setSortOrder(opt.value)}
                      className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-all duration-200 ${
                        sortOrder === opt.value
                          ? 'bg-[var(--galactic-aurora)] text-white border-violet-600 shadow-md shadow-violet-500/25'
                          : 'bg-white/5 text-[var(--galactic-diamond)]/60 border-white/10 hover:border-[var(--galactic-aurora)]/20 hover:text-[var(--galactic-aurora)]'
                      }`}
                    >
                      {opt.icon}
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-white/5" />

              {/* === Jabatan (Position) === */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-[var(--galactic-aurora-soft)]" />
                  <h4 className="text-sm font-semibold text-[var(--galactic-diamond)]">Jabatan</h4>
                </div>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-1">
                  <button
                    onClick={() => setJabatanFilter('all')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all duration-200 ${
                      jabatanFilter === 'all'
                        ? 'bg-[var(--galactic-aurora)] text-white border-[var(--galactic-aurora)] shadow-md shadow-[var(--galactic-aurora)]/25'
                        : 'bg-white/5 text-[var(--galactic-diamond)]/60 border-white/10 hover:border-[var(--galactic-aurora)]/30 hover:text-[var(--galactic-aurora)]'
                    }`}
                  >
                    {jabatanFilter === 'all' && <Check className="h-3 w-3" />}
                    Semua
                  </button>
                  {uniquePositions.map(pos => (
                    <button
                      key={pos}
                      onClick={() => setJabatanFilter(jabatanFilter === pos ? 'all' : pos)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all duration-200 ${
                        jabatanFilter === pos
                          ? 'bg-[var(--galactic-aurora)] text-white border-[var(--galactic-aurora)] shadow-md shadow-[var(--galactic-aurora)]/25'
                          : 'bg-white/5 text-[var(--galactic-diamond)]/60 border-white/10 hover:border-[var(--galactic-aurora)]/30 hover:text-[var(--galactic-aurora)]'
                      }`}
                    >
                      {jabatanFilter === pos && <Check className="h-3 w-3" />}
                      {pos}
                    </button>
                  ))}
                  {uniquePositions.length === 0 && (
                    <p className="text-xs text-[var(--galactic-diamond)]/60 italic">Belum ada data jabatan</p>
                  )}
                </div>
              </div>

              <div className="border-t border-white/5" />

              {/* === Kinerja (Performance) === */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-[var(--galactic-emerald)]" />
                  <h4 className="text-sm font-semibold text-[var(--galactic-diamond)]">Kinerja</h4>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {kinerjaOptions.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setKinerjaFilter(opt.value)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-all duration-200 ${
                        kinerjaFilter === opt.value ? opt.activeColor : opt.color
                      } ${opt.value === 'all' ? 'col-span-2' : ''}`}
                    >
                      <span>{opt.emoji}</span>
                      {opt.label}
                      {opt.value !== 'all' && (
                        <span className={`ml-auto text-xs font-normal ${
                          kinerjaFilter === opt.value ? 'opacity-80' : 'opacity-50'
                        }`}>
                          ({members.filter(m => matchKinerja(m.avgScore) === opt.value).length})
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                size="sm"
                onClick={resetFilters}
                className="gap-1.5"
                disabled={activeFilterCount === 0}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset Filter
              </Button>
              <Button
                size="sm"
                className="bg-[var(--galactic-aurora)] hover:bg-[var(--galactic-cosmic)] gap-1.5"
                onClick={() => setFilterOpen(false)}
              >
                <Check className="h-3.5 w-3.5" />
                Terapkan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Gender Filter Tabs */}
        <div className="flex gap-1 bg-white/[0.03] p-1 rounded-xl">
          {genderTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === tab.value
                  ? 'bg-white/5 text-[var(--galactic-diamond)] shadow-[0_0_15px_rgba(255,255,255,0.05)]'
                  : 'text-[var(--galactic-diamond)]/60 hover:text-[var(--galactic-diamond)]'
              }`}
            >
              <span className="mr-1.5">{tab.icon}</span>
              {tab.label}
              <span className="ml-1.5 text-xs opacity-60">
                ({tab.value === 'all'
                  ? members.length
                  : tab.value === 'Laki-laki'
                  ? maleCount
                  : femaleCount})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Active Filter Tags */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 animate-in slide-in-from-top-1 duration-200">
          <span className="text-xs text-[var(--galactic-diamond)]/60 font-medium">Filter aktif:</span>
          {sortOrder !== 'none' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--galactic-aurora)]/10 text-[var(--galactic-aurora)] text-xs font-medium ring-1 ring-[var(--galactic-aurora)]/20">
              {sortOrder === 'asc' ? <ArrowDownAZ className="h-3 w-3" /> : <ArrowUpZA className="h-3 w-3" />}
              {sortOrder === 'asc' ? 'A → Z' : 'Z → A'}
              <button onClick={() => setSortOrder('none')} className="ml-0.5 hover:text-[var(--galactic-aurora-soft)] transition-colors">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {jabatanFilter !== 'all' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--galactic-aurora)]/10 text-[var(--galactic-aurora)] text-xs font-medium ring-1 ring-[var(--galactic-aurora)]/20">
              <Briefcase className="h-3 w-3" />
              {jabatanFilter}
              <button onClick={() => setJabatanFilter('all')} className="ml-0.5 hover:text-[var(--galactic-aurora)] transition-colors">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {kinerjaFilter !== 'all' && (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ring-1 ${
              kinerjaFilter === 'sangat-baik' ? 'bg-[var(--galactic-emerald)]/10 text-[var(--galactic-emerald)] ring-[var(--galactic-emerald)]/20' :
              kinerjaFilter === 'baik' ? 'bg-[var(--galactic-aurora)]/10 text-[var(--galactic-aurora)] ring-[var(--galactic-aurora)]/20' :
              kinerjaFilter === 'cukup' ? 'bg-[var(--galactic-amber)]/10 text-[var(--galactic-amber)] ring-[var(--galactic-amber)]/20' :
              'bg-[var(--galactic-rose)]/10 text-[var(--galactic-rose)] ring-[var(--galactic-rose)]/20'
            }`}>
              <TrendingUp className="h-3 w-3" />
              {kinerjaOptions.find(k => k.value === kinerjaFilter)?.label}
              <button onClick={() => setKinerjaFilter('all')} className="ml-0.5 hover:opacity-80 transition-opacity">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          <button
            onClick={resetFilters}
            className="text-xs text-[var(--galactic-diamond)]/60 hover:text-[var(--galactic-rose)] transition-colors ml-1 underline underline-offset-2"
          >
            Hapus semua
          </button>
        </div>
      )}

      {/* Loading */}
      {isLoading && members.length === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-40 bg-white/10 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {/* Members Display */}
      {!isLoading && (
        <>
          {activeTab === 'all' ? (
            <>
              <GenderSection
                title="Laki-laki"
                icon="👨"
                color="blue"
                members={filtered.filter(m => m.gender === 'Laki-laki')}
              />
              <GenderSection
                title="Perempuan"
                icon="👩"
                color="pink"
                members={filtered.filter(m => m.gender === 'Perempuan')}
              />
            </>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((member, idx) => (
                <MemberCard key={member.id} member={member} idx={idx} />
              ))}
            </div>
          )}

          {!isLoading && filtered.length === 0 && members.length > 0 && (
            <div className="text-center py-16">
              <Users className="h-16 w-16 text-[var(--galactic-diamond)]/60 mx-auto mb-4" />
              <p className="text-[var(--galactic-diamond)]/60 text-lg">Tidak ada anggota yang cocok dengan pencarian.</p>
              <p className="text-[var(--galactic-diamond)]/60 text-sm mt-1">Coba ubah kata kunci atau filter</p>
            </div>
          )}

          {!isLoading && members.length === 0 && !error && (
            <div className="text-center py-16">
              <Users className="h-16 w-16 text-[var(--galactic-diamond)]/60 mx-auto mb-4" />
              <p className="text-[var(--galactic-diamond)]/60 text-lg">Belum ada anggota terdaftar.</p>
              {isAdmin && (
                <Button
                  className="mt-4 bg-[var(--galactic-aurora)] hover:bg-[var(--galactic-cosmic)]"
                  onClick={() => setShowAddForm(true)}
                >
                  <UserPlus className="mr-2 h-4 w-4" /> Tambah Anggota Pertama
                </Button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function GenderSection({
  title,
  icon,
  color,
  members,
}: {
  title: string;
  icon: string;
  color: 'blue' | 'pink';
  members: Member[];
}) {
  if (members.length === 0) return null;

  const borderColor = color === 'blue' ? 'border-[var(--galactic-aurora)]/20' : 'border-[var(--galactic-rose)]/20';
  const bgColor = color === 'blue' ? 'bg-[var(--galactic-aurora)]/10' : 'bg-[var(--galactic-rose)]/10';
  const textColor = color === 'blue' ? 'text-[var(--galactic-aurora)]' : 'text-[var(--galactic-rose)]';

  return (
    <div className="space-y-3">
      <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${bgColor} border ${borderColor}`}>
        <span className="text-lg">{icon}</span>
        <h3 className={`font-semibold text-sm ${textColor}`}>
          {title} ({members.length} anggota)
        </h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {members.map((member, idx) => (
          <MemberCard key={member.id} member={member} idx={idx} />
        ))}
      </div>
    </div>
  );
}

function MemberCard({
  member,
  idx,
}: {
  member: Member;
  idx: number;
}) {
  const isMale = member.gender === 'Laki-laki';
  const genderBadgeColor = isMale
    ? 'bg-[var(--galactic-aurora)]/10 text-[var(--galactic-aurora)] ring-[var(--galactic-aurora)]/20'
    : 'bg-[var(--galactic-rose)]/10 text-[var(--galactic-rose)] ring-[var(--galactic-rose)]/20';
  const cardHoverBorder = isMale
    ? 'hover:border-[var(--galactic-aurora)]/20'
    : 'hover:border-[var(--galactic-rose)]/20';

  return (
    <Link href={`/members/${member.id}`}>
      <GlassCard className={`shadow-[0_0_15px_rgba(255,255,255,0.05)] border border-white/10 hover:shadow-lg ${cardHoverBorder} transition-all duration-300 cursor-pointer group hover:-translate-y-0.5`}>
        <GlassCardContent className="p-5">
          <div className="flex items-start gap-4">
            {/* Avatar / Photo */}
            {member.photoUrl ? (
              <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 ring-2 ring-white shadow">
                <img src={member.photoUrl} alt={member.name} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow ${avatarColors[idx % avatarColors.length]}`}>
                {member.avatarInitial}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className={`font-semibold text-[var(--galactic-diamond)] truncate transition-colors ${isMale ? 'group-hover:text-[var(--galactic-aurora)]' : 'group-hover:text-[var(--galactic-rose)]'}`}>
                  {member.name}
                </h3>
                <ChevronRight className={`h-4 w-4 text-[var(--galactic-diamond)]/60 transition-colors flex-shrink-0 ${isMale ? 'group-hover:text-[var(--galactic-aurora)]' : 'group-hover:text-[var(--galactic-rose)]'}`} />
              </div>
              {member.position && <p className="text-xs text-[var(--galactic-diamond)]/60 mt-0.5">{member.position}</p>}
              <p className="text-sm text-[var(--galactic-diamond)]/80">{member.department}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <Badge variant="outline" className={`text-xs font-medium ring-1 ${genderBadgeColor}`}>
                  {member.gender === 'Laki-laki' ? '👨' : '👩'} {member.gender}
                </Badge>
              </div>
              {member.email && (
                <div className="flex items-center gap-2 mt-2">
                  <Mail className="h-3.5 w-3.5 text-[var(--galactic-diamond)]/60" />
                  <span className="text-xs text-[var(--galactic-diamond)]/60 truncate">{member.email}</span>
                </div>
              )}
              {member.phone && (
                <div className="flex items-center gap-2 mt-1">
                  <Phone className="h-3.5 w-3.5 text-[var(--galactic-diamond)]/60" />
                  <span className="text-xs text-[var(--galactic-diamond)]/60">{member.phone}</span>
                </div>
              )}
              <div className="mt-3">
                <RatingBadge score={member.avgScore} />
              </div>
            </div>
          </div>
        </GlassCardContent>
      </GlassCard>
    </Link>
  );
}
