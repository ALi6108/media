'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RatingBadge } from '@/components/shared/RatingBadge';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { performanceApi } from '@/services/performance.api';

interface PerfEntry {
  id: string;
  member_id: string;
  period_week: number;
  period_year: number;
  ikr_score: number;
  competency_score: number;
  final_score: number;
}

interface ApiResponse {
  data: PerfEntry[];
  meta?: { page: number; totalPages: number; total: number };
}

export default function PerformanceHistoryPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PerfEntry[]>([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const years = [2024, 2025, 2026, 2027];

  useEffect(() => {
    setLoading(true);
    performanceApi
      .getAll({ year, page })
      .then((res) => {
        const r = res.data as ApiResponse;
        setData(r.data || []);
        setMeta(r.meta || { page: 1, totalPages: 1, total: 0 });
      })
      .catch(() => {
        setData([]);
        setMeta({ page: 1, totalPages: 1, total: 0 });
      })
      .finally(() => setLoading(false));
  }, [year, page]);

  const weeklyData = useMemo(() => {
    const weeklyMap = new Map<number, { week: number; entries: PerfEntry[] }>();
    data.forEach((entry) => {
      const w = entry.period_week;
      if (!weeklyMap.has(w)) weeklyMap.set(w, { week: w, entries: [] });
      weeklyMap.get(w)!.entries.push(entry);
    });
    return Array.from(weeklyMap.values())
      .map(({ week, entries }) => ({
        week,
        totalMembers: entries.length,
        avgIkr: Number(
          (entries.reduce((s, e) => s + e.ikr_score, 0) / entries.length).toFixed(1)
        ),
        avgComp: Number(
          (entries.reduce((s, e) => s + e.competency_score, 0) / entries.length).toFixed(1)
        ),
        avgFinal: Number(
          (entries.reduce((s, e) => s + e.final_score, 0) / entries.length).toFixed(1)
        ),
      }))
      .sort((a, b) => b.week - a.week);
  }, [data]);

  function handleYearChange(newYear: number) {
    setYear(newYear);
    setPage(1);
  }

  return (
    <div className="space-y-6">
      <Link href="/members/performance">
        <Button variant="ghost" className="text-slate-500 hover:text-slate-700 -ml-2">
          <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
        </Button>
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Riwayat Input Kinerja</h2>
          <p className="text-slate-500 text-sm mt-1">
            Data kinerja tim yang telah diinput sebelumnya
          </p>
        </div>
        <select
          value={year}
          onChange={(e) => handleYearChange(Number(e.target.value))}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      <Card className="shadow-sm border border-slate-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-slate-700">
            Riwayat Mingguan &mdash; {year}
            {meta.total > 0 && (
              <span className="text-slate-400 font-normal ml-2">({meta.total} entri)</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-10 bg-slate-100 rounded animate-pulse" />
              ))}
            </div>
          ) : weeklyData.length === 0 ? (
            <div className="text-center py-10 text-slate-500">
              <p>Belum ada data kinerja untuk tahun {year}</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 font-semibold text-slate-600">Minggu</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-600">
                        Jumlah Anggota
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-600">Avg IKR</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-600">
                        Avg Kompetensi
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-600">
                        Avg Final
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-600">Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    {weeklyData.map((w) => (
                      <tr
                        key={w.week}
                        className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                      >
                        <td className="py-3 px-4 font-medium text-slate-700">W{w.week}</td>
                        <td className="py-3 px-4 text-slate-600">{w.totalMembers}</td>
                        <td className="py-3 px-4 text-slate-600">{w.avgIkr}</td>
                        <td className="py-3 px-4 text-slate-600">{w.avgComp}</td>
                        <td className="py-3 px-4 font-semibold text-slate-800">{w.avgFinal}</td>
                        <td className="py-3 px-4">
                          <RatingBadge score={w.avgFinal} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {meta.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
                  <span className="text-sm text-slate-500">
                    Halaman {meta.page} dari {meta.totalPages}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      Sebelumnya
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= meta.totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Selanjutnya
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
