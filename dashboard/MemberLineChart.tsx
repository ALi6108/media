'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import type { PerformanceWeek } from '@/store/memberStore';

interface MemberLineChartProps {
  data: PerformanceWeek[];
  title?: string;
}

export function MemberLineChart({ data, title = 'Riwayat Kinerja Individu' }: MemberLineChartProps) {
  const chartData = data.map(h => ({
    week: `W${h.week}`,
    ikr: h.ikr,
    competency: h.competency,
    final: h.final,
  }));

  return (
    <Card className="glass-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-[var(--galactic-diamond)]">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: 'rgba(232,224,240,0.6)' }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} tickLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'rgba(232,224,240,0.6)' }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} tickLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(10,14,39,0.8)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '1rem',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line type="monotone" dataKey="ikr" name="IKR" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="competency" name="Kompetensi" stroke="#ec4899" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="final" name="Final" stroke="#ffffff" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-[var(--galactic-diamond)]/80">
              Belum ada data kinerja
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
