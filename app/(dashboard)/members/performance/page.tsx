'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm, useFieldArray, useWatch, type Control } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RatingBadge } from '@/components/shared/RatingBadge';
import { useAuthStore } from '@/store/authStore';
import { useFilterStore } from '@/store/filterStore';
import { performanceApi } from '@/services/performance.api';
import { membersApi } from '@/services/members.api';
import { ChevronLeft, ChevronRight, Save, Loader2, Calculator, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const entrySchema = z.object({
  memberId: z.string(),
  memberName: z.string(),
  ikrScore: z.coerce.number().min(0).max(100),
  competencyScore: z.coerce.number().min(0).max(100),
});

const formSchema = z.object({
  entries: z.array(entrySchema),
});

type FormValues = z.infer<typeof formSchema>;

function ScoreCell({ control, index }: { control: Control<FormValues>; index: number }) {
  const ikr = useWatch({ control, name: `entries.${index}.ikrScore` as const });
  const comp = useWatch({ control, name: `entries.${index}.competencyScore` as const });

  const finalScore = Number(((Number(ikr) || 0) * 0.6 + (Number(comp) || 0) * 0.4).toFixed(2));

  return (
    <div className="flex items-center gap-3">
      <span className="text-lg font-bold text-slate-800 min-w-[50px]">{finalScore}</span>
      <RatingBadge score={finalScore} showScore={false} />
    </div>
  );
}

export default function PerformancePage() {
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [existingEntryMap, setExistingEntryMap] = useState<Record<string, { id: string; ikr_score: number; competency_score: number }>>({});
  const { user } = useAuthStore();
  const { selectedYear, selectedWeek, setWeek, setYear } = useFilterStore();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { entries: [] },
  });

  const { fields, replace } = useFieldArray({
    control: form.control,
    name: 'entries',
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [membersRes, perfRes] = await Promise.all([
        membersApi.getAll(),
        performanceApi.getAll({ year: selectedYear, week: selectedWeek }),
      ]);

      const members: Array<{ id: string; full_name: string }> = membersRes.data || [];
      const perfEntries: Array<{ id: string; member_id: string; ikr_score: number; competency_score: number }> = perfRes.data || [];

      const perfMap: Record<string, { id: string; ikr_score: number; competency_score: number }> = {};
      for (const entry of perfEntries) {
        perfMap[entry.member_id] = {
          id: entry.id,
          ikr_score: entry.ikr_score,
          competency_score: entry.competency_score,
        };
      }

      setExistingEntryMap(perfMap);
      setIsUpdateMode(perfEntries.length > 0);

      const formEntries = members.map((m) => ({
        memberId: m.id,
        memberName: m.full_name,
        ikrScore: perfMap[m.id]?.ikr_score ?? 0,
        competencyScore: perfMap[m.id]?.competency_score ?? 0,
      }));

      replace(formEntries);
    } catch {
      toast.error('Gagal memuat data');
    } finally {
      setIsLoading(false);
    }
  }, [selectedYear, selectedWeek, replace]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && user?.role === 'ADMIN') {
      fetchData();
    }
  }, [mounted, user?.role, fetchData]);

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    try {
      if (isUpdateMode) {
        await Promise.all(
          values.entries.map(async (entry) => {
            const existing = existingEntryMap[entry.memberId];
            if (existing) {
              await performanceApi.update(existing.id, {
                ikr_score: entry.ikrScore,
                competency_score: entry.competencyScore,
              });
            } else {
              await performanceApi.create({
                member_id: entry.memberId,
                period_year: selectedYear,
                period_week: selectedWeek,
                ikr_score: entry.ikrScore,
                competency_score: entry.competencyScore,
              });
            }
          })
        );
        toast.success('Data kinerja berhasil diperbarui');
      } else {
        await performanceApi.createBatch({
          period_week: selectedWeek,
          period_year: selectedYear,
          entries: values.entries.map((e) => ({
            member_id: e.memberId,
            ikr_score: e.ikrScore,
            competency_score: e.competencyScore,
          })),
        });
        toast.success('Data kinerja berhasil disimpan');
      }

      await fetchData();
    } catch {
      toast.error('Gagal menyimpan data kinerja');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!mounted) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-20 bg-slate-200 rounded-xl" />
        <div className="h-96 bg-slate-200 rounded-xl" />
      </div>
    );
  }

  if (user?.role !== 'ADMIN') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
          <AlertCircle className="h-8 w-8 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800">Akses Ditolak</h2>
        <p className="text-slate-500 mt-2">Halaman ini hanya dapat diakses oleh Admin.</p>
        <p className="text-sm text-slate-400 mt-1">Error 403 — Forbidden</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Input Kinerja Mingguan</h2>
          <p className="text-slate-500 text-sm mt-1">
            Masukkan skor IKR dan Kompetensi untuk setiap anggota
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Calculator className="h-4 w-4 text-blue-500" />
          <span className="text-slate-500">Formula: (IKR × 0.6) + (Kompetensi × 0.4)</span>
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex flex-wrap items-center gap-3 bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-600">Tahun:</label>
          <select
            value={selectedYear}
            onChange={(e) => setYear(Number(e.target.value))}
            className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {[2024, 2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <div className="h-5 w-px bg-slate-200" />
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setWeek(selectedWeek - 1)}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-semibold text-slate-700 min-w-[100px] text-center">
            Minggu {selectedWeek}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setWeek(selectedWeek + 1)}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-slate-200 rounded-lg w-1/3" />
          <div className="h-96 bg-slate-200 rounded-xl" />
        </div>
      ) : (
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card className="shadow-sm border border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-slate-700 flex items-center">
                <span>Skor Kinerja — {fields.length} Anggota</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="ml-2 h-6 w-6"
                  onClick={fetchData}
                  disabled={isLoading}
                  aria-label="Refresh data"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {fields.length === 0 ? (
                <p className="text-slate-500 text-center py-8">Tidak ada anggota aktif.</p>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left py-3 px-4 font-semibold text-slate-600 w-8">#</th>
                          <th className="text-left py-3 px-4 font-semibold text-slate-600">Nama Anggota</th>
                          <th className="text-left py-3 px-4 font-semibold text-slate-600 w-36">IKR (60%)</th>
                          <th className="text-left py-3 px-4 font-semibold text-slate-600 w-36">Kompetensi (40%)</th>
                          <th className="text-left py-3 px-4 font-semibold text-slate-600">Skor Akhir & Rating</th>
                        </tr>
                      </thead>
                      <tbody>
                        {fields.map((field, index) => (
                          <tr key={field.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                            <td className="py-3 px-4 text-slate-400 font-mono">{index + 1}</td>
                            <td className="py-3 px-4">
                              <span className="font-medium text-slate-700">{form.getValues(`entries.${index}.memberName`)}</span>
                            </td>
                            <td className="py-3 px-4">
                              <Input
                                type="number"
                                min={0}
                                max={100}
                                className="w-28 h-9"
                                {...form.register(`entries.${index}.ikrScore`, { valueAsNumber: true })}
                              />
                              {form.formState.errors.entries?.[index]?.ikrScore && (
                                <p className="text-xs text-red-500 mt-1">0-100</p>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <Input
                                type="number"
                                min={0}
                                max={100}
                                className="w-28 h-9"
                                {...form.register(`entries.${index}.competencyScore`, { valueAsNumber: true })}
                              />
                              {form.formState.errors.entries?.[index]?.competencyScore && (
                                <p className="text-xs text-red-500 mt-1">0-100</p>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <ScoreCell control={form.control} index={index} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end mt-6 pt-4 border-t border-slate-200">
                    <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 px-8">
                      {isSubmitting ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Menyimpan...</>
                      ) : (
                        <><Save className="mr-2 h-4 w-4" />{isUpdateMode ? 'Update' : 'Simpan Semua'}</>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </form>
      )}
    </div>
  );
}
