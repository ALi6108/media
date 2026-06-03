'use client';

import { StatCard } from '@/components/shared/StatCard';
import { Users, TrendingUp, Award, AlertTriangle } from 'lucide-react';

interface StatCardsGridProps {
  totalMembers: number;
  avgFinal: number;
  topPerformerName: string;
  topPerformerScore: number;
  needAttention: number;
  maleCount: number;
  femaleCount: number;
  isLoading?: boolean;
}

export function StatCardsGrid({
  totalMembers,
  avgFinal,
  topPerformerName,
  topPerformerScore,
  needAttention,
  maleCount,
  femaleCount,
  isLoading,
}: StatCardsGridProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Ringkasan Kinerja</h2>
          <p className="text-slate-500 text-sm mt-1">
            Tahun {new Date().getFullYear()} &middot;{' '}
            <span className="text-blue-600">{maleCount}👨</span>{' '}
            <span className="text-pink-600">{femaleCount}👩</span>
          </p>
        </div>
      </div>

      {isLoading && (
        <div className="text-center py-4 text-slate-400 text-sm">Memuat data dari server...</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Anggota"
          value={totalMembers}
          subtitle="Anggota aktif"
          icon={Users}
          variant="blue"
        />
        <StatCard
          title="Rata-rata Nilai"
          value={avgFinal > 0 ? avgFinal.toFixed(1) : '-'}
          subtitle="Final Score"
          icon={TrendingUp}
          variant="green"
        />
        <StatCard
          title="Top Performer"
          value={topPerformerName && topPerformerScore > 0 ? topPerformerName.split(' ')[0] : '-'}
          subtitle={topPerformerName && topPerformerScore > 0 ? `Skor: ${topPerformerScore}` : 'Belum ada data'}
          icon={Award}
          variant="amber"
        />
        <StatCard
          title="Perlu Perhatian"
          value={needAttention.toString()}
          subtitle="Skor < 70"
          icon={AlertTriangle}
          variant="red"
        />
      </div>
    </div>
  );
}
