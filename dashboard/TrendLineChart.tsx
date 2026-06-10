'use client';

import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from '@/components/ui/glass-card';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

interface TrendEntry {
  week: string;
  avgIkr: number;
  avgComp: number;
  avgFinal: number;
}

interface TrendLineChartProps {
  data: TrendEntry[];
}

export function TrendLineChart({ data }: TrendLineChartProps) {
  const hasData = data.some(d => d.avgFinal > 0);

  return (
    <GlassCard>
      <GlassCardHeader className="pb-2">
        <GlassCardTitle className="text-base">
          Tren Rata-rata Kinerja Tim
        </GlassCardTitle>
      </GlassCardHeader>
      <GlassCardContent>
        <div className="h-72">
          {hasData ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                  dataKey="week" 
                  tick={{ fontSize: 11, fill: 'rgba(232,224,240,0.6)' }} 
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} 
                  tickLine={{ stroke: 'rgba(255,255,255,0.1)' }} 
                />
                <YAxis 
                  domain={[0, 100]} 
                  tick={{ fontSize: 11, fill: 'rgba(232,224,240,0.6)' }} 
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} 
                  tickLine={{ stroke: 'rgba(255,255,255,0.1)' }} 
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(18,8,37,0.8)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '1rem',
                    color: '#e8e0f0',
                    fontSize: '12px',
                  }}
                  itemStyle={{ color: '#e8e0f0' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', color: 'rgba(232,224,240,0.8)' }} />
                <Line 
                  type="monotone" 
                  dataKey="avgIkr" 
                  name="Rata-rata IKR" 
                  stroke="#3b82f6" 
                  strokeWidth={3} 
                  dot={{ r: 4, strokeWidth: 2, fill: '#0a0e27', stroke: '#3b82f6' }} 
                  activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff', fill: '#3b82f6' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="avgComp" 
                  name="Rata-rata Kompetensi" 
                  stroke="#ec4899" 
                  strokeWidth={3} 
                  dot={{ r: 4, strokeWidth: 2, fill: '#0a0e27', stroke: '#ec4899' }} 
                  activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff', fill: '#ec4899' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="avgFinal" 
                  name="Rata-rata Final" 
                  stroke="#ffffff" 
                  strokeWidth={3} 
                  dot={{ r: 4, strokeWidth: 2, fill: '#0a0e27', stroke: '#ffffff' }} 
                  activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff', fill: '#ffffff' }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-[var(--galactic-diamond)]/60">
              Tidak ada data kinerja
            </div>
          )}
        </div>
      </GlassCardContent>
    </GlassCard>
  );
}
