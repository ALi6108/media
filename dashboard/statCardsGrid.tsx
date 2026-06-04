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
  
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-6">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-white/10 rounded-lg animate-pulse" />
            <div className="h-4 w-64 bg-white/5 rounded-md animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard isLoading={true} title="" value="" icon={Users} />
          <StatCard isLoading={true} title="" value="" icon={Users} />
          <StatCard isLoading={true} title="" value="" icon={Users} />
          <StatCard isLoading={true} title="" value="" icon={Users} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 z-10 relative">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-heading font-bold text-[var(--galactic-diamond)] drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]">Ringkasan Kinerja</h2>
          <p className="text-[var(--galactic-diamond)]/60 text-sm mt-2 flex items-center gap-2">
            Tahun {new Date().getFullYear()} &middot;
            <span className="glass px-2 py-0.5 rounded-md ring-1 ring-[var(--galactic-aurora)]/30 text-[var(--galactic-aurora-soft)]/80 drop-shadow-[0_0_5px_rgba(59,130,246,0.5)] shadow-[inset_0_0_10px_rgba(59,130,246,0.1)]">
              {maleCount} 👨
            </span>
            <span className="glass px-2 py-0.5 rounded-md ring-1 ring-[var(--galactic-rose)]/30 text-[var(--galactic-rose)]">
              {femaleCount} 👩
            </span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
