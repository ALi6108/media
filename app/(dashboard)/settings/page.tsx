'use client';

import { useState, useEffect } from 'react';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle, GlassCardDescription as CardDescription } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/authStore';
import { usersApi } from '@/services/users.api';
import {
  Shield, UserPlus, Trash2, AlertCircle, Save, Loader2, Power
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

interface ApiUser {
  id: string;
  email: string;
  full_name: string;
  role: 'ADMIN' | 'VIEWER';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const createUserSchema = z.object({
  full_name: z.string().min(1, 'Nama harus diisi'),
  email: z.string().email('Email tidak valid'),
  password: z.string().min(8, 'Password minimal 8 karakter'),
  role: z.enum(['ADMIN', 'VIEWER']),
});

type CreateUserForm = z.infer<typeof createUserSchema>;

export default function SettingsPage() {
  const [mounted, setMounted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const { user, setUser } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<CreateUserForm>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { full_name: '', email: '', password: '', role: 'VIEWER' },
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isAdmin) fetchUsers();
  }, [isAdmin]);

  async function fetchUsers() {
    setLoading(true);
    setError(null);
    try {
      const res = await usersApi.getAll();
      setUsers(res.data || []);
    } catch {
      setError('Gagal memuat data pengguna');
      toast.error('Gagal memuat data pengguna');
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveProfile() {
    if (!user || !nameValue.trim()) return;
    setSaving(true);
    try {
      await usersApi.update(user.id, { full_name: nameValue });
      setUser({ ...user, name: nameValue });
      toast.success('Profil berhasil diperbarui');
    } catch {
      toast.error('Gagal memperbarui profil');
    } finally {
      setSaving(false);
    }
  }

  async function onCreateUser(data: CreateUserForm) {
    try {
      await usersApi.create(data);
      toast.success('Pengguna berhasil ditambahkan');
      setDialogOpen(false);
      reset();
      fetchUsers();
    } catch {
      toast.error('Gagal menambahkan pengguna');
    }
  }

  async function handleDeleteUser(id: string, name: string) {
    if (!window.confirm(`Hapus pengguna "${name}"?`)) return;
    try {
      await usersApi.delete(id);
      toast.success('Pengguna berhasil dihapus');
      fetchUsers();
    } catch {
      toast.error('Gagal menghapus pengguna');
    }
  }

  async function handleToggleActive(id: string, currentActive: boolean) {
    try {
      await usersApi.toggleActive(id);
      toast.success(currentActive ? 'Pengguna dinonaktifkan' : 'Pengguna diaktifkan');
      fetchUsers();
    } catch {
      toast.error('Gagal mengubah status pengguna');
    }
  }

  if (!mounted) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-40 bg-white/10 rounded-xl" />
        <div className="h-40 bg-white/10 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-heading font-bold text-[var(--galactic-diamond)]">Pengaturan</h2>
        <p className="text-[var(--galactic-diamond)]/80 text-sm mt-1">Kelola preferensi dan konfigurasi akun</p>
      </div>

      <GlassCard className="shadow-[0_0_15px_rgba(255,255,255,0.05)] border border-white/10">
        <GlassCardHeader>
          <GlassCardTitle className="text-base font-semibold text-[var(--galactic-diamond)]">Profil</GlassCardTitle>
          <CardDescription>Informasi akun yang sedang aktif</CardDescription>
        </GlassCardHeader>
        <GlassCardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold shadow-lg">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div>
              <p className="font-semibold text-[var(--galactic-diamond)]">{user?.name}</p>
              <p className="text-sm text-[var(--galactic-diamond)]/80">{user?.email}</p>
              <Badge variant="outline" className="mt-1 text-xs">
                <Shield className="h-3 w-3 mr-1" />
                {user?.role}
              </Badge>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-white/5">
            <div className="space-y-2">
              <Label className="text-sm text-[var(--galactic-diamond)]/80">Nama</Label>
              <Input
                className="h-10"
                defaultValue={user?.name || ''}
                onChange={(e) => setNameValue(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-[var(--galactic-diamond)]/80">Email</Label>
              <Input defaultValue={user?.email || ''} className="h-10" disabled />
            </div>
          </div>
          <Button className="bg-[var(--galactic-aurora)] hover:bg-[var(--galactic-cosmic)]" onClick={handleSaveProfile} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Simpan Perubahan
          </Button>
        </GlassCardContent>
      </GlassCard>

      {isAdmin ? (
        <GlassCard className="shadow-[0_0_15px_rgba(255,255,255,0.05)] border border-white/10">
          <GlassCardHeader>
            <div className="flex items-center justify-between">
              <div>
                <GlassCardTitle className="text-base font-semibold text-[var(--galactic-diamond)]">Manajemen Pengguna</GlassCardTitle>
                <CardDescription>Kelola akses pengguna ke dashboard</CardDescription>
              </div>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger
                  render={
                    <Button size="sm" className="bg-[var(--galactic-aurora)] hover:bg-[var(--galactic-cosmic)]">
                      <UserPlus className="mr-2 h-4 w-4" /> Tambah User
                    </Button>
                  }
                />
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Tambah Pengguna Baru</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit(onCreateUser)} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Nama Lengkap</Label>
                      <Input {...register('full_name')} placeholder="Nama lengkap" />
                      {errors.full_name && <p className="text-xs text-[var(--galactic-rose)]">{errors.full_name.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input {...register('email')} placeholder="email@example.com" type="email" />
                      {errors.email && <p className="text-xs text-[var(--galactic-rose)]">{errors.email.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label>Password</Label>
                      <Input {...register('password')} placeholder="Minimal 6 karakter" type="password" />
                      {errors.password && <p className="text-xs text-[var(--galactic-rose)]">{errors.password.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label>Role</Label>
                      <select
                        {...register('role')}
                        className="flex h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--galactic-aurora)] focus-visible:ring-offset-2"
                      >
                        <option value="VIEWER">Viewer</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
                      <Button type="submit" className="bg-[var(--galactic-aurora)] hover:bg-[var(--galactic-cosmic)]" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Simpan
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </GlassCardHeader>
          <GlassCardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-white/5 animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/10" />
                      <div className="space-y-1">
                        <div className="h-4 w-32 bg-white/10 rounded" />
                        <div className="h-3 w-48 bg-white/10 rounded" />
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-5 w-16 bg-white/10 rounded-full" />
                      <div className="h-8 w-8 bg-white/10 rounded-lg" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <AlertCircle className="h-10 w-10 text-[var(--galactic-rose)]/60 mx-auto mb-3" />
                <p className="text-[var(--galactic-diamond)]/80 font-medium">{error}</p>
                <Button variant="outline" className="mt-3" onClick={fetchUsers}>Coba Lagi</Button>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="h-10 w-10 text-[var(--galactic-diamond)]/60 mx-auto mb-3" />
                <p className="text-[var(--galactic-diamond)]/80 font-medium">Belum ada pengguna</p>
                <p className="text-xs text-[var(--galactic-diamond)]/60 mt-1">Tambahkan pengguna pertama untuk memulai</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-4 font-semibold text-[var(--galactic-diamond)]/80 text-sm uppercase tracking-wider">Username</th>
                      <th className="text-left py-3 px-4 font-semibold text-[var(--galactic-diamond)]/80 text-sm uppercase tracking-wider">Email</th>
                      <th className="text-left py-3 px-4 font-semibold text-[var(--galactic-diamond)]/80 text-sm uppercase tracking-wider">Role</th>
                      <th className="text-left py-3 px-4 font-semibold text-[var(--galactic-diamond)]/80 text-sm uppercase tracking-wider">Status</th>
                      <th className="text-right py-3 px-4 font-semibold text-[var(--galactic-diamond)]/80 text-sm uppercase tracking-wider">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${u.is_active ? 'bg-white/10 text-[var(--galactic-diamond)]/80' : 'bg-white/[0.03] text-[var(--galactic-diamond)]/60'}`}>
                              {u.full_name.charAt(0)}
                            </div>
                            <span className={`font-medium ${u.is_active ? 'text-[var(--galactic-diamond)]' : 'text-[var(--galactic-diamond)]/60'}`}>{u.full_name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-[var(--galactic-diamond)]/80">{u.email}</td>
                        <td className="py-3 px-4">
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              u.role === 'ADMIN'
                                ? 'text-[var(--galactic-aurora)] bg-[var(--galactic-aurora)]/10 border-[var(--galactic-aurora)]/20'
                                : 'text-[var(--galactic-diamond)]/80 bg-white/[0.02]'
                            }`}
                          >
                            {u.role === 'ADMIN' ? 'Admin' : 'Viewer'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          {u.is_active ? (
                            <span className="text-xs text-[var(--galactic-emerald)]">Aktif</span>
                          ) : (
                            <Badge variant="outline" className="text-xs text-[var(--galactic-rose)] bg-[var(--galactic-rose)]/10 border-[var(--galactic-rose)]/20">
                              Nonaktif
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {u.id !== user?.id && (
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className={`h-8 w-8 ${u.is_active ? 'text-[var(--galactic-diamond)]/60 hover:text-[var(--galactic-amber)]' : 'text-[var(--galactic-emerald)] hover:text-[var(--galactic-emerald)]'}`}
                                onClick={() => handleToggleActive(u.id, u.is_active)}
                                title={u.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                              >
                                <Power className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-[var(--galactic-diamond)]/60 hover:text-[var(--galactic-rose)]"
                                onClick={() => handleDeleteUser(u.id, u.full_name)}
                                title="Hapus"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </GlassCardContent>
        </GlassCard>
      ) : (
        <GlassCard className="shadow-[0_0_15px_rgba(255,255,255,0.05)] border border-white/10">
          <GlassCardContent className="p-8 text-center">
            <AlertCircle className="h-10 w-10 text-[var(--galactic-diamond)]/60 mx-auto mb-3" />
            <p className="text-[var(--galactic-diamond)]/80 font-medium">Manajemen pengguna hanya tersedia untuk Admin.</p>
          </GlassCardContent>
        </GlassCard>
      )}
    </div>
  );
}
