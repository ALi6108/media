'use client';

import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from '@/components/ui/glass-card';
import { RatingBadge } from '@/components/shared/RatingBadge';

interface RankingEntry {
  rank: number;
  name: string;
  gender: string;
  final: number;
}

interface MemberRankingTableProps {
  data: RankingEntry[];
}

export function MemberRankingTable({ data }: MemberRankingTableProps) {
  return (
    <GlassCard>
      <GlassCardHeader className="pb-3 border-b border-white/5">
        <GlassCardTitle className="text-base text-[var(--galactic-diamond)] drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]">
          Peringkat Kinerja
        </GlassCardTitle>
      </GlassCardHeader>
      <GlassCardContent className="pt-4">
        <div className="overflow-x-auto scrollbar-none">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                {['Peringkat', 'Nama', 'Gender', 'Skor Akhir', 'Rating'].map((h) => (
                  <th key={h} className="text-left py-3 px-4 font-heading font-medium text-[var(--galactic-diamond)]/80 text-sm uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.length > 0 ? data.map((member) => (
                <tr key={member.rank} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors group">
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ring-1 ring-white/10 shadow-[0_0_10px_rgba(255,255,255,0.05)] ${
                      member.rank === 1 ? 'bg-gradient-to-br from-[var(--galactic-amber)] to-orange-600 text-white shadow-[0_0_15px_rgba(251,191,36,0.4)] border border-[var(--galactic-amber)]/50' :
                      member.rank === 2 ? 'bg-gradient-to-br from-[var(--galactic-platinum)] to-slate-400 text-[var(--galactic-diamond)] shadow-[0_0_15px_rgba(248,246,252,0.4)] border border-[var(--galactic-platinum)]/50' :
                      member.rank === 3 ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-[0_0_15px_rgba(249,115,22,0.4)] border border-orange-400/50' :
                      'bg-white/5 text-[var(--galactic-diamond)]/70 group-hover:bg-white/10 transition-colors'
                    }`}>
                      {member.rank}
                    </span>
                  </td>
                  <td className={`py-3 px-4 font-medium text-[var(--galactic-diamond)] transition-colors ${member.gender === 'Laki-laki' ? 'group-hover:text-[var(--galactic-aurora-soft)]' : 'group-hover:text-[var(--galactic-rose)]'}`}>{member.name}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium tracking-wide ring-1 ring-white/10 backdrop-blur-md ${
                      member.gender === 'Laki-laki' ? 'bg-[var(--galactic-aurora)]/10 text-[var(--galactic-aurora-soft)]/80 border border-blue-500/20' : 'bg-[var(--galactic-rose)]/10 text-[var(--galactic-rose)] border border-[var(--galactic-rose)]/20'
                    }`}>
                      {member.gender === 'Laki-laki' ? '👨' : '👩'} {member.gender}
                    </span>
                  </td>
                  <td className={`py-3 px-4 font-heading font-semibold text-[var(--galactic-diamond)] transition-colors ${member.gender === 'Laki-laki' ? 'group-hover:text-[var(--galactic-aurora-soft)]' : 'group-hover:text-[var(--galactic-rose)]'}`}>{member.final}</td>
                  <td className="py-3 px-4">
                    {member.final > 0 ? <RatingBadge score={member.final} /> : <span className="text-[var(--galactic-diamond)]/60">-</span>}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[var(--galactic-diamond)]/60">
                    Belum ada data anggota
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCardContent>
    </GlassCard>
  );
}
