'use client';

import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from '@/components/ui/glass-card';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

interface PerformanceEntry {
  name: string;
  fullName: string;
  ikr: number;
  competency: number;
  final: number;
}

interface PerformanceBarChartProps {
  data: PerformanceEntry[];
}

export function PerformanceBarChart({ data }: PerformanceBarChartProps) {
  const hasData = data.some(p => p.final > 0);

  return (
    <GlassCard>
      <GlassCardHeader className="pb-2">
        <GlassCardTitle className="text-base">
          Perbandingan Kinerja per Anggota
        </GlassCardTitle>
      </GlassCardHeader>
      <GlassCardContent>
        <div className="h-72">
          {hasData ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} barGap={4}>
                <defs>
                  <linearGradient id="colorIkr" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9}/>
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.2}/>
                  </linearGradient>
                  <linearGradient id="colorComp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ec4899" stopOpacity={0.9}/>
                    <stop offset="100%" stopColor="#ec4899" stopOpacity={0.2}/>
                  </linearGradient>
                  <linearGradient id="colorFinal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity={0.9}/>
                    <stop offset="100%" stopColor="#ffffff" stopOpacity={0.2}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                  dataKey="name" 
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
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', color: 'rgba(232,224,240,0.8)' }} />
                <Bar dataKey="ikr" name="IKR (60%)" fill="url(#colorIkr)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="competency" name="Kompetensi (40%)" fill="url(#colorComp)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="final" name="Final" fill="url(#colorFinal)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-[var(--galactic-diamond)]/60">
              Belum ada data kinerja
            </div>
          )}
        </div>
      </GlassCardContent>
    </GlassCard>
  );
}
