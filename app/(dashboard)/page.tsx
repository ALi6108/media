'use client';

import { useEffect, useState } from 'react';
import { useMemberStore } from '@/store/memberStore';
import { StatCardsGrid } from '@/dashboard/statCardsGrid';
import { PerformanceBarChart } from '@/dashboard/performanceBarChart';
import { TrendLineChart } from '@/dashboard/TrendLineChart';
import { MemberRankingTable } from '@/dashboard/memberRankingTable';

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const { members, fetchMembers, isLoading } = useMemberStore();

  useEffect(() => {
    setMounted(true);
    fetchMembers();
  }, []);

  const chartData = members.map(m => {
    const lastWeek = m.performanceHistory.length > 0
      ? m.performanceHistory[m.performanceHistory.length - 1]
      : { ikr: 0, competency: 0, final: 0 };
    return {
      name: m.name.split(' ')[0],
      fullName: m.name,
      gender: m.gender,
      ikr: lastWeek.ikr,
      competency: lastWeek.competency,
      final: lastWeek.final,
      avgScore: m.avgScore,
    };
  });

  const maxWeeks = Math.max(...members.map(m => m.performanceHistory.length), 0);
  const trendData = Array.from({ length: maxWeeks }, (_, weekIdx) => {
    let totalIkr = 0, totalComp = 0, totalFinal = 0, count = 0;
    members.forEach(m => {
      const w = m.performanceHistory[weekIdx];
      if (w) {
        totalIkr += w.ikr;
        totalComp += w.competency;
        totalFinal += w.final;
        count++;
      }
    });
    return {
      week: `W${weekIdx + 1}`,
      avgIkr: count > 0 ? Number((totalIkr / count).toFixed(1)) : 0,
      avgComp: count > 0 ? Number((totalComp / count).toFixed(1)) : 0,
      avgFinal: count > 0 ? Number((totalFinal / count).toFixed(1)) : 0,
    };
  });

  const rankingData = [...chartData]
    .sort((a, b) => b.avgScore - a.avgScore)
    .map((m, idx) => ({
      rank: idx + 1,
      name: m.fullName,
      gender: m.gender,
      final: m.avgScore,
    }));

  const avgFinal = chartData.length > 0
    ? chartData.reduce((sum, m) => sum + m.avgScore, 0) / chartData.length
    : 0;

  const topPerformer = rankingData.length > 0 && rankingData[0].final > 0 ? rankingData[0] : null;
  const needAttention = chartData.filter(m => m.avgScore > 0 && m.avgScore < 70).length;
  const maleCount = chartData.filter(m => m.gender === 'Laki-laki').length;
  const femaleCount = chartData.filter(m => m.gender === 'Perempuan').length;

  if (!mounted) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-white/[0.05] rounded-xl" />
          ))}
        </div>
        <div className="h-80 bg-white/[0.05] rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <StatCardsGrid
        totalMembers={chartData.length}
        avgFinal={avgFinal}
        topPerformerName={topPerformer?.name || ''}
        topPerformerScore={topPerformer?.final || 0}
        needAttention={needAttention}
        maleCount={maleCount}
        femaleCount={femaleCount}
        isLoading={isLoading}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PerformanceBarChart data={chartData} />
        <TrendLineChart data={trendData} />
      </div>

      <MemberRankingTable data={rankingData} />
    </div>
  );
}
