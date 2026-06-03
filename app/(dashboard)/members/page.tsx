'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
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
  { value: 'all', label: 'Semua', emoji: '📊', color: 'text-slate-600 border-slate-200 bg-white hover:border-slate-300', activeColor: 'bg-slate-800 text-white border-slate-800 shadow-md' },
  { value: 'sangat-baik', label: 'Sangat Baik', emoji: '🌟', color: 'text-emerald-600 border-emerald-200 bg-emerald-50/50 hover:border-emerald-300', activeColor: 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/25' },
  { value: 'baik', label: 'Baik', emoji: '✅', color: 'text-blue-600 border-blue-200 bg-blue-50/50 hover:border-blue-300', activeColor: 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/25' },
  { value: 'cukup', label: 'Cukup', emoji: '⚡', color: 'text-amber-600 border-amber-200 bg-amber-50/50 hover:border-amber-300', activeColor: 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/25' },
  { value: 'kurang', label: 'Kurang', emoji: '📉', color: 'text-red-600 border-red-200 bg-red-50/50 hover:border-red-300', activeColor: 'bg-red-500 text-white border-red-500 shadow-md shadow-red-500/25' },
];

function matchKinerja(score: number): KinerjaFilter {
  if (score >= 90) return 'sangat-baik';
  if (score >= 75) return 'baik';
  if (score >= 60) return 'cukup';
  return 'kurang';
}

const avatarColors = [
  'bg-blue-500', 'bg-indigo-500', 'bg-violet-500',
  'bg-pink-500', 'bg-teal-500', 'bg-emerald-500',
  'bg-rose-500', 'bg-cyan-500',
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
          <h2 className="text-2xl font-bold text-slate-800">Anggota Tim</h2>
          <p className="text-slate-500 text-sm mt-1">
            {members.length} anggota terdaftar &middot;{' '}
            <span className="text-blue-600">{maleCount} Laki-laki</span> &middot;{' '}
            <span className="text-pink-600">{femaleCount} Perempuan</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => fetchMembers()}
            disabled={isLoading}
            className="border-slate-200"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          {isAdmin && (
            <Button
              className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/25 transition-all duration-200"
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
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
          <Button size="sm" variant="ghost" className="ml-2 text-red-600" onClick={() => fetchMembers()}>
            Coba Lagi
          </Button>
        </div>
      )}

      {/* Quick Add Form - Inline */}
      {showAddForm && (
        <Card className="shadow-lg border-2 border-blue-200 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 animate-in slide-in-from-top-2 duration-300">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <UserPlus className="h-4 w-4 text-white" />
              </div>
              Tambah Anggota Baru
            </h3>

            {addError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {addError}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Photo Upload */}
              <div className="flex flex-col items-center gap-3 md:row-span-2">
                <div
                  className="w-28 h-28 rounded-2xl border-2 border-dashed border-slate-300 hover:border-blue-400 flex items-center justify-center cursor-pointer transition-colors overflow-hidden bg-white"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center">
                      <Camera className="h-8 w-8 text-slate-300 mx-auto" />
                      <span className="text-xs text-slate-400 mt-1 block">Upload Foto</span>
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
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Hapus Foto
                  </button>
                )}
              </div>

              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Nama Lengkap *</label>
                <Input
                  placeholder="Masukkan nama lengkap"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={formErrors.name ? 'border-red-400' : ''}
                />
                {formErrors.name && <p className="text-xs text-red-500">{formErrors.name}</p>}
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Email</label>
                <Input
                  type="email"
                  placeholder="email@media.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={formErrors.email ? 'border-red-400' : ''}
                />
                {formErrors.email && <p className="text-xs text-red-500">{formErrors.email}</p>}
              </div>

              {/* Position */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Posisi / Jabatan *</label>
                <Input
                  placeholder="Contoh: Content Creator"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  className={formErrors.position ? 'border-red-400' : ''}
                />
                {formErrors.position && <p className="text-xs text-red-500">{formErrors.position}</p>}
              </div>

              {/* Department */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Divisi *</label>
                <Input
                  placeholder="Contoh: Media Sosial"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className={formErrors.department ? 'border-red-400' : ''}
                />
                {formErrors.department && <p className="text-xs text-red-500">{formErrors.department}</p>}
              </div>

              {/* Gender */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Jenis Kelamin</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, gender: 'Laki-laki' })}
                    className={`flex-1 px-4 py-2 rounded-lg border text-sm font-medium transition-all duration-200 ${
                      formData.gender === 'Laki-laki'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                    }`}
                  >
                    👨 Laki-laki
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, gender: 'Perempuan' })}
                    className={`flex-1 px-4 py-2 rounded-lg border text-sm font-medium transition-all duration-200 ${
                      formData.gender === 'Perempuan'
                        ? 'bg-pink-600 text-white border-pink-600 shadow-md'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-pink-300'
                    }`}
                  >
                    👩 Perempuan
                  </button>
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">No. Telepon</label>
                <Input
                  placeholder="08xxxxxxxxxx"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200">
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Batal
              </Button>
              <Button
                onClick={handleAddMember}
                disabled={isAdding}
                className="bg-blue-600 hover:bg-blue-700 shadow-md"
              >
                {isAdding ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...</>
                ) : (
                  <><Save className="mr-2 h-4 w-4" /> Simpan Anggota</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search + Filter + Gender Tabs */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
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
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-600 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600 hover:shadow-md'
                }`}
              />
            }
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filter
            {activeFilterCount > 0 && (
              <span className="flex items-center justify-center w-5 h-5 text-[10px] font-bold rounded-full bg-white text-blue-600 shadow-sm">
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
                  <ArrowDownAZ className="h-4 w-4 text-violet-500" />
                  <h4 className="text-sm font-semibold text-slate-700">Abjad</h4>
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
                          ? 'bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-500/25'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-violet-300 hover:text-violet-600'
                      }`}
                    >
                      {opt.icon}
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-100" />

              {/* === Jabatan (Position) === */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-blue-500" />
                  <h4 className="text-sm font-semibold text-slate-700">Jabatan</h4>
                </div>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-1">
                  <button
                    onClick={() => setJabatanFilter('all')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all duration-200 ${
                      jabatanFilter === 'all'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/25'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600'
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
                          ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/25'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600'
                      }`}
                    >
                      {jabatanFilter === pos && <Check className="h-3 w-3" />}
                      {pos}
                    </button>
                  ))}
                  {uniquePositions.length === 0 && (
                    <p className="text-xs text-slate-400 italic">Belum ada data jabatan</p>
                  )}
                </div>
              </div>

              <div className="border-t border-slate-100" />

              {/* === Kinerja (Performance) === */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                  <h4 className="text-sm font-semibold text-slate-700">Kinerja</h4>
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
                        <span className={`ml-auto text-[10px] font-normal ${
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
                className="bg-blue-600 hover:bg-blue-700 gap-1.5"
                onClick={() => setFilterOpen(false)}
              >
                <Check className="h-3.5 w-3.5" />
                Terapkan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Gender Filter Tabs */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
          {genderTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === tab.value
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
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
          <span className="text-xs text-slate-400 font-medium">Filter aktif:</span>
          {sortOrder !== 'none' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-100 text-violet-700 text-xs font-medium ring-1 ring-violet-200">
              {sortOrder === 'asc' ? <ArrowDownAZ className="h-3 w-3" /> : <ArrowUpZA className="h-3 w-3" />}
              {sortOrder === 'asc' ? 'A → Z' : 'Z → A'}
              <button onClick={() => setSortOrder('none')} className="ml-0.5 hover:text-violet-900 transition-colors">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {jabatanFilter !== 'all' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium ring-1 ring-blue-200">
              <Briefcase className="h-3 w-3" />
              {jabatanFilter}
              <button onClick={() => setJabatanFilter('all')} className="ml-0.5 hover:text-blue-900 transition-colors">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {kinerjaFilter !== 'all' && (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ring-1 ${
              kinerjaFilter === 'sangat-baik' ? 'bg-emerald-100 text-emerald-700 ring-emerald-200' :
              kinerjaFilter === 'baik' ? 'bg-blue-100 text-blue-700 ring-blue-200' :
              kinerjaFilter === 'cukup' ? 'bg-amber-100 text-amber-700 ring-amber-200' :
              'bg-red-100 text-red-700 ring-red-200'
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
            className="text-xs text-slate-400 hover:text-red-500 transition-colors ml-1 underline underline-offset-2"
          >
            Hapus semua
          </button>
        </div>
      )}

      {/* Loading */}
      {isLoading && members.length === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-40 bg-slate-200 rounded-xl animate-pulse" />
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
              <Users className="h-16 w-16 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-400 text-lg">Tidak ada anggota yang cocok dengan pencarian.</p>
              <p className="text-slate-300 text-sm mt-1">Coba ubah kata kunci atau filter</p>
            </div>
          )}

          {!isLoading && members.length === 0 && !error && (
            <div className="text-center py-16">
              <Users className="h-16 w-16 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-400 text-lg">Belum ada anggota terdaftar.</p>
              {isAdmin && (
                <Button
                  className="mt-4 bg-blue-600 hover:bg-blue-700"
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

  const borderColor = color === 'blue' ? 'border-blue-200' : 'border-pink-200';
  const bgColor = color === 'blue' ? 'bg-blue-50' : 'bg-pink-50';
  const textColor = color === 'blue' ? 'text-blue-700' : 'text-pink-700';

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
  const genderBadgeColor =
    member.gender === 'Laki-laki'
      ? 'bg-blue-100 text-blue-700 ring-blue-200'
      : 'bg-pink-100 text-pink-700 ring-pink-200';

  return (
    <Link href={`/members/${member.id}`}>
      <Card className="shadow-sm border border-slate-200 hover:shadow-lg hover:border-blue-200 transition-all duration-300 cursor-pointer group hover:-translate-y-0.5">
        <CardContent className="p-5">
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
                <h3 className="font-semibold text-slate-800 truncate group-hover:text-blue-600 transition-colors">
                  {member.name}
                </h3>
                <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-blue-500 transition-colors flex-shrink-0" />
              </div>
              {member.position && <p className="text-xs text-slate-400 mt-0.5">{member.position}</p>}
              <p className="text-sm text-slate-500">{member.department}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <Badge variant="outline" className={`text-xs font-medium ring-1 ${genderBadgeColor}`}>
                  {member.gender === 'Laki-laki' ? '👨' : '👩'} {member.gender}
                </Badge>
              </div>
              {member.email && (
                <div className="flex items-center gap-2 mt-2">
                  <Mail className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-xs text-slate-400 truncate">{member.email}</span>
                </div>
              )}
              {member.phone && (
                <div className="flex items-center gap-2 mt-1">
                  <Phone className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-xs text-slate-400">{member.phone}</span>
                </div>
              )}
              <div className="mt-3">
                <RatingBadge score={member.avgScore} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
