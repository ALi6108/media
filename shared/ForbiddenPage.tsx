'use client';

import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function ForbiddenPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
        <AlertCircle className="h-8 w-8 text-red-500" />
      </div>
      <h2 className="text-2xl font-heading font-bold text-[var(--galactic-diamond)]">Akses Ditolak</h2>
      <p className="text-[var(--galactic-diamond)]/70 mt-2">Halaman ini hanya dapat diakses oleh Admin.</p>
      <p className="text-sm text-[var(--galactic-diamond)]/60 mt-1">Error 403 — Forbidden</p>
      <Button
        variant="outline"
        className="mt-4"
        onClick={() => router.push('/')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Dashboard
      </Button>
    </div>
  );
}
