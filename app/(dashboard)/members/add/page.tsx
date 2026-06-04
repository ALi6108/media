'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import Link from 'next/link';
import { useMemberStore } from '@/store/memberStore';
import { useAuthStore } from '@/store/authStore';

const memberSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter'),
  email: z.string().email('Email tidak valid'),
  position: z.string().min(2, 'Posisi wajib diisi'),
  department: z.string().min(2, 'Divisi wajib diisi'),
  gender: z.union([z.enum(['Laki-laki', 'Perempuan']), z.literal('')]).refine((val) => val !== '', { message: 'Jenis kelamin wajib dipilih' }),
});

type MemberForm = z.input<typeof memberSchema>;

export default function AddMemberPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checking, setChecking] = useState(true);
  const router = useRouter();
  const addMember = useMemberStore((s) => s.addMember);
  const { user: authUser } = useAuthStore();
  const isAdmin = authUser?.role === 'ADMIN';

  useEffect(() => {
    if (!isAdmin) {
      router.replace('/members');
    } else {
      setChecking(false);
    }
  }, [isAdmin, router]);

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-white/[0.08] border-t-[var(--galactic-aurora)] rounded-full animate-spin" />
      </div>
    );
  }

  const { register, handleSubmit, formState: { errors } } = useForm<MemberForm>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      gender: '',
    },
  });

  async function onSubmit(values: MemberForm) {
    if (!isAdmin) return;
    setIsSubmitting(true);
    try {
      await addMember({
        name: values.name,
        email: values.email,
        position: values.position,
        department: values.department,
        gender: values.gender as 'Laki-laki' | 'Perempuan',
        phone: '',
        joinDate: new Date().toISOString().split('T')[0],
        photoUrl: null,
      });
      router.push('/members');
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <Link href="/members">
        <Button variant="ghost" className="text-[var(--galactic-diamond)]/70 hover:text-[var(--galactic-diamond)] -ml-2">
          <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
        </Button>
      </Link>

      <Card className="glass-card border-0">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-[var(--galactic-diamond)]">Tambah Anggota Baru</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label>Nama Lengkap</Label>
              <Input placeholder="Masukkan nama lengkap" {...register('name')} />
              {errors.name && <p className="text-xs text-[var(--galactic-rose)]">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" placeholder="email@media.com" {...register('email')} />
              {errors.email && <p className="text-xs text-[var(--galactic-rose)]">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Posisi / Jabatan</Label>
              <Input placeholder="Contoh: Content Creator" {...register('position')} />
              {errors.position && <p className="text-xs text-[var(--galactic-rose)]">{errors.position.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Divisi</Label>
              <Input placeholder="Contoh: Media Sosial" {...register('department')} />
              {errors.department && <p className="text-xs text-[var(--galactic-rose)]">{errors.department.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Jenis Kelamin</Label>
              <select {...register('gender')} className="border border-white/15 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[var(--galactic-aurora)]">
                <option value="">Pilih Jenis Kelamin</option>
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
              {errors.gender && <p className="text-xs text-[var(--galactic-rose)]">{errors.gender.message}</p>}
            </div>
            <Button type="submit" disabled={isSubmitting} className="bg-[var(--galactic-aurora)] hover:brightness-110">
              {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Menyimpan...</> : <><Save className="mr-2 h-4 w-4" />Simpan</>}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
