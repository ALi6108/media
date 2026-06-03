'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/authStore';
import { usersApi } from '@/services/users.api';
import {
  Sun, Moon, Monitor, Shield, UserPlus, Trash2, AlertCircle, Save, Loader2, Power
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
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('light');
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
    if (typeof window !== 'undefined') {
      const root = document.documentElement;
      if (root.classList.contains('dark')) setTheme('dark');
      else setTheme('light');
    }
  }, []);

  useEffect(() => {
    if (isAdmin) fetchUsers();
  }, [isAdmin]);

  async function fetchUsers() {
    setLoading(true);
    setError(null);
    try {
      const res = await usersApi.getAll();
      setUsers(res.data.data || []);
    } catch {
      setError('Gagal memuat data pengguna');
      toast.error('Gagal memuat data pengguna');
    } finally {
      setLoading(false);
    }
  }

  function toggleTheme(newTheme: 'light' | 'dark' | 'system') {
    setTheme(newTheme);
    const root = document.documentElement;
    if (newTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
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
        <div className="h-40 bg-slate-200 rounded-xl" />
        <div className="h-40 bg-slate-200 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Pengaturan</h2>
        <p className="text-slate-500 text-sm mt-1">Kelola preferensi dan konfigurasi akun</p>
      </div>

      <Card className="shadow-sm border border-slate-200">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-slate-700">Profil</CardTitle>
          <CardDescription>Informasi akun yang sedang aktif</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold shadow-lg">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div>
              <p className="font-semibold text-slate-800">{user?.name}</p>
              <p className="text-sm text-slate-500">{user?.email}</p>
              <Badge variant="outline" className="mt-1 text-xs">
                <Shield className="h-3 w-3 mr-1" />
                {user?.role}
              </Badge>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
            <div className="space-y-2">
              <Label className="text-sm text-slate-600">Nama</Label>
              <Input
                className="h-10"
                defaultValue={user?.name || ''}
                onChange={(e) => setNameValue(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-slate-600">Email</Label>
              <Input defaultValue={user?.email || ''} className="h-10" disabled />
            </div>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleSaveProfile} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Simpan Perubahan
          </Button>
        </CardContent>
      </Card>

      <Card className="shadow-sm border border-slate-200">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-slate-700">Tampilan</CardTitle>
          <CardDescription>Atur tema tampilan dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            {[
              { key: 'light' as const, icon: Sun, label: 'Terang' },
              { key: 'dark' as const, icon: Moon, label: 'Gelap' },
              { key: 'system' as const, icon: Monitor, label: 'Sistem' },
            ].map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                onClick={() => toggleTheme(key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                  theme === key
                    ? 'border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-100'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {isAdmin ? (
        <Card className="shadow-sm border border-slate-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold text-slate-700">Manajemen Pengguna</CardTitle>
                <CardDescription>Kelola akses pengguna ke dashboard</CardDescription>
              </div>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger
                  render={
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
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
                      {errors.full_name && <p className="text-xs text-red-500">{errors.full_name.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input {...register('email')} placeholder="email@example.com" type="email" />
                      {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label>Password</Label>
                      <Input {...register('password')} placeholder="Minimal 6 karakter" type="password" />
                      {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label>Role</Label>
                      <select
                        {...register('role')}
                        className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                      >
                        <option value="VIEWER">Viewer</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
                      <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Simpan
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-200" />
                      <div className="space-y-1">
                        <div className="h-4 w-32 bg-slate-200 rounded" />
                        <div className="h-3 w-48 bg-slate-200 rounded" />
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-5 w-16 bg-slate-200 rounded-full" />
                      <div className="h-8 w-8 bg-slate-200 rounded-lg" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <AlertCircle className="h-10 w-10 text-red-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">{error}</p>
                <Button variant="outline" className="mt-3" onClick={fetchUsers}>Coba Lagi</Button>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">Belum ada pengguna</p>
                <p className="text-xs text-slate-400 mt-1">Tambahkan pengguna pertama untuk memulai</p>
              </div>
            ) : (
              <div className="space-y-3">
                {users.map((u) => (
                  <div key={u.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${u.is_active ? 'bg-slate-200 text-slate-600' : 'bg-slate-100 text-slate-400'}`}>
                        {u.full_name.charAt(0)}
                      </div>
                      <div>
                        <p className={`font-medium text-sm ${u.is_active ? 'text-slate-700' : 'text-slate-400'}`}>{u.full_name}</p>
                        <p className="text-xs text-slate-400">{u.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            u.role === 'ADMIN'
                              ? 'text-blue-600 bg-blue-50 border-blue-200'
                              : 'text-slate-500 bg-slate-50'
                          }`}
                        >
                          {u.role}
                        </Badge>
                        {!u.is_active && (
                          <Badge variant="outline" className="text-xs text-red-500 bg-red-50 border-red-200">
                            Nonaktif
                          </Badge>
                        )}
                      </div>
                      {u.id !== user?.id && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`h-8 w-8 ${u.is_active ? 'text-slate-400 hover:text-amber-500' : 'text-green-500 hover:text-green-600'}`}
                            onClick={() => handleToggleActive(u.id, u.is_active)}
                            title={u.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                          >
                            <Power className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-red-500"
                            onClick={() => handleDeleteUser(u.id, u.full_name)}
                            title="Hapus"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-sm border border-slate-200">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">Manajemen pengguna hanya tersedia untuk Admin.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
