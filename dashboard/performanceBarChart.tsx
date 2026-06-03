'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    <Card className="shadow-sm border border-slate-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-slate-700">
          Perbandingan Kinerja per Anggota
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          {hasData ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="ikr" name="IKR (60%)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="competency" name="Kompetensi (40%)" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="final" name="Final" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400">
              Belum ada data kinerja
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
