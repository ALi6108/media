'use client';

import { useState } from 'react';
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
  const router = useRouter();
  const addMember = useMemberStore((s) => s.addMember);

  const { register, handleSubmit, formState: { errors } } = useForm<MemberForm>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      gender: '',
    },
  });

  async function onSubmit(values: MemberForm) {
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
        <Button variant="ghost" className="text-slate-500 hover:text-slate-700 -ml-2">
          <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
        </Button>
      </Link>

      <Card className="shadow-sm border border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-800">Tambah Anggota Baru</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label>Nama Lengkap</Label>
              <Input placeholder="Masukkan nama lengkap" {...register('name')} />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" placeholder="email@media.com" {...register('email')} />
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Posisi / Jabatan</Label>
              <Input placeholder="Contoh: Content Creator" {...register('position')} />
              {errors.position && <p className="text-xs text-red-500">{errors.position.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Divisi</Label>
              <Input placeholder="Contoh: Media Sosial" {...register('department')} />
              {errors.department && <p className="text-xs text-red-500">{errors.department.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Jenis Kelamin</Label>
              <select {...register('gender')} className="border border-slate-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Pilih Jenis Kelamin</option>
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
              {errors.gender && <p className="text-xs text-red-500">{errors.gender.message}</p>}
            </div>
            <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
              {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Menyimpan...</> : <><Save className="mr-2 h-4 w-4" />Simpan</>}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
