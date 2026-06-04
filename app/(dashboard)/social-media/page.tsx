'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm, useFieldArray, useWatch, type Control } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/store/authStore';
import { useFilterStore } from '@/store/filterStore';
import { socialMediaApi } from '@/services/socialMedia.api';
import {
  ChevronLeft, ChevronRight, Save, Loader2,
  Camera, Play, Globe, FileText, RefreshCw, BarChart3,
} from 'lucide-react';
import { toast } from 'sonner';
import { SOCIAL_ACCOUNTS, PLATFORM_KEYS, type PlatformKey } from '@/lib/constants/social-links';
import { SocialMediaFollowersChart } from '@/dashboard/SocialMediaFollowersChart';
import { SocialMediaEngagementChart } from '@/dashboard/SocialMediaEngagementChart';

const entrySchema = z.object({
  key: z.string(),
  label: z.string(),
  platform: z.string(),
  accountName: z.string(),
  followers_count: z.coerce.number().min(0, 'Min 0'),
  total_posts: z.coerce.number().min(0, 'Min 0'),
});

const formSchema = z.object({
  entries: z.array(entrySchema),
});

type FormValues = z.infer<typeof formSchema>;

const PLATFORM_META: Record<PlatformKey, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  IG_IPNU: { icon: Camera, color: 'text-[var(--galactic-rose)]', bg: 'bg-[var(--galactic-rose)]/10', label: 'IG IPNU' },
  IG_IPPNU: { icon: Camera, color: 'text-[var(--galactic-rose-soft)]', bg: 'bg-[var(--galactic-rose)]/10', label: 'IG IPPNU' },
  YOUTUBE: { icon: Play, color: 'text-red-500', bg: 'bg-[var(--galactic-rose)]/10', label: 'YouTube' },
  TIKTOK: { icon: FileText, color: 'text-[var(--galactic-diamond)]', bg: 'bg-white/[0.02]', label: 'TikTok' },
  BLOG: { icon: Globe, color: 'text-[var(--galactic-aurora)]', bg: 'bg-[var(--galactic-aurora)]/10', label: 'Blog' },
};

const CALC: Record<PlatformKey, { baseER: number; reachPerFollower: number; impMult: number }> = {
  IG_IPNU: { baseER: 3.5, reachPerFollower: 4.5, impMult: 2.3 },
  IG_IPPNU: { baseER: 3.3, reachPerFollower: 4.3, impMult: 2.2 },
  YOUTUBE: { baseER: 5.0, reachPerFollower: 5.5, impMult: 2.0 },
  TIKTOK: { baseER: 5.5, reachPerFollower: 6.0, impMult: 2.4 },
  BLOG: { baseER: 1.5, reachPerFollower: 5.0, impMult: 1.8 },
};

function autoCalc(platform: PlatformKey, followers: number, posts: number) {
  if (followers <= 0) return { reach: 0, impressions: 0, er: 0 };
  const c = CALC[platform];
  const activity = Math.min(posts / followers, 2);
  const reach = Math.round(followers * (c.reachPerFollower + activity * 2));
  const impressions = Math.round(reach * c.impMult);
  const er = Math.round((c.baseER + activity * 1.5) * 10) / 10;
  return { reach, impressions, er };
}

function CalcCell({ control, index }: { control: Control<FormValues>; index: number }) {
  const platform = useWatch({ control, name: `entries.${index}.key` as const });
  const followers = useWatch({ control, name: `entries.${index}.followers_count` as const });
  const posts = useWatch({ control, name: `entries.${index}.total_posts` as const });

  const calc = autoCalc(platform as PlatformKey, followers || 0, posts || 0);

  if (!followers && !posts) {
    return <span className="text-xs text-[var(--galactic-diamond)]/60">—</span>;
  }

  return (
    <div className="flex flex-col gap-0.5 text-xs">
      <span className="text-[var(--galactic-diamond)]/60">Reach: <strong className="text-[var(--galactic-diamond)]">{calc.reach.toLocaleString()}</strong></span>
      <span className="text-[var(--galactic-diamond)]/60">Impressions: <strong className="text-[var(--galactic-diamond)]">{calc.impressions.toLocaleString()}</strong></span>
      <span className="text-[var(--galactic-diamond)]/60">ER: <strong className="text-[var(--galactic-diamond)]">{calc.er}%</strong></span>
    </div>
  );
}

interface TrendRow {
  week: string;
  [key: string]: string | number;
}

function buildFollowersTrend(data: Array<{ platform: PlatformKey; period_week: number; followers_count: number }>): TrendRow[] {
  const grouped = new Map<number, TrendRow>();
  for (const item of data) {
    if (!grouped.has(item.period_week)) {
      grouped.set(item.period_week, { week: `W${item.period_week}` });
    }
    const entry = grouped.get(item.period_week)!;
    const val = Number(item.followers_count) || 0;
    const prev = Number(entry[item.platform]) || 0;
    entry[item.platform] = prev + val;
  }
  return Array.from(grouped.values()).sort((a, b) => Number(a.week.slice(1)) - Number(b.week.slice(1)));
}

function buildEngagementTrend(data: Array<{ platform: PlatformKey; period_week: number; engagement_rate: number }>): TrendRow[] {
  const grouped = new Map<number, TrendRow>();
  for (const item of data) {
    if (!grouped.has(item.period_week)) {
      grouped.set(item.period_week, { week: `W${item.period_week}` });
    }
    const entry = grouped.get(item.period_week)!;
    entry[item.platform] = item.engagement_rate;
  }
  return Array.from(grouped.values()).sort((a, b) => Number(a.week.slice(1)) - Number(b.week.slice(1)));
}

export default function SocialMediaPage() {
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [existingEntryMap, setExistingEntryMap] = useState<Record<string, { id: string; followers_count: number; total_posts: number }>>({});
  const [trend, setTrend] = useState<Array<{ platform: PlatformKey; period_week: number; period_label: string; followers_count: number; engagement_rate: number }>>([]);

  const { user } = useAuthStore();
  const { selectedYear, selectedWeek, setWeek, setYear } = useFilterStore();
  const isAdmin = user?.role === 'ADMIN';

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
      const [weekRes, allRes] = await Promise.allSettled([
        socialMediaApi.getAll({ year: selectedYear, week: selectedWeek }),
        socialMediaApi.getAll({ year: selectedYear }),
      ]);

      const weekEntries: Array<{ id: string; platform: string; account_name: string; period_week: number; period_year: number; followers_count: number; total_posts: number; engagement_rate?: number; total_reach?: number; total_impressions?: number }> =
        weekRes.status === 'fulfilled' ? (weekRes.value.data || []) : [];
      const allEntries: Array<{ id: string; platform: string; account_name: string; period_week: number; period_year: number; followers_count: number; total_posts: number; engagement_rate?: number; total_reach?: number; total_impressions?: number }> =
        allRes.status === 'fulfilled' ? (allRes.value.data || []) : [];

      // map current week entries for the form
      const entryMap: Record<string, { id: string; followers_count: number; total_posts: number }> = {};
      for (const entry of weekEntries) {
        const key = Object.entries(SOCIAL_ACCOUNTS).find(([, v]) => v.platform === entry.platform && v.accountName === entry.account_name)?.[0];
        if (key) {
          entryMap[key] = { id: entry.id, followers_count: entry.followers_count ?? 0, total_posts: entry.total_posts ?? 0 };
        }
      }

      setExistingEntryMap(entryMap);
      setIsUpdateMode(weekEntries.length > 0);

      // build trend data from ALL year entries (more reliable than /trend endpoint)
      const trendMap = new Map<string, { platform: PlatformKey; period_week: number; period_label: string; followers_count: number; engagement_rate: number }>();
      for (const entry of allEntries) {
        const key = Object.entries(SOCIAL_ACCOUNTS).find(
          ([, v]) => v.platform === entry.platform && v.accountName === entry.account_name
        )?.[0] as PlatformKey | undefined;
        if (!key) continue;
        const wk = entry.period_week;
        const label = `W${wk} ${entry.period_year || selectedYear}`;
        const uid = `${key}-${wk}`;
        const calc = autoCalc(key, entry.followers_count ?? 0, entry.total_posts ?? 0);
        if (trendMap.has(uid)) {
          const t = trendMap.get(uid)!;
          t.followers_count = entry.followers_count ?? t.followers_count;
          t.engagement_rate = calc.er;
        } else {
          trendMap.set(uid, {
            platform: key,
            period_week: wk,
            period_label: label,
            followers_count: entry.followers_count ?? 0,
            engagement_rate: entry.engagement_rate ?? calc.er,
          });
        }
      }

      // ensure current week entries are always present
      for (const entry of weekEntries) {
        const key = Object.entries(SOCIAL_ACCOUNTS).find(
          ([, v]) => v.platform === entry.platform && v.accountName === entry.account_name
        )?.[0] as PlatformKey | undefined;
        if (!key) continue;
        const uid = `${key}-${selectedWeek}`;
        const calc = autoCalc(key, entry.followers_count ?? 0, entry.total_posts ?? 0);
        trendMap.set(uid, {
          platform: key,
          period_week: selectedWeek,
          period_label: `W${selectedWeek} ${selectedYear}`,
          followers_count: entry.followers_count ?? 0,
          engagement_rate: calc.er,
        });
      }

      setTrend(Array.from(trendMap.values()));

      const formEntries = PLATFORM_KEYS.map((key) => {
        const account = SOCIAL_ACCOUNTS[key];
        const existing = entryMap[key];
        return {
          key,
          label: PLATFORM_META[key].label,
          platform: account.platform,
          accountName: account.accountName,
          followers_count: existing?.followers_count ?? 0,
          total_posts: existing?.total_posts ?? 0,
        };
      });

      replace(formEntries);
    } catch {
      toast.error('Gagal memuat data');
      const formEntries = PLATFORM_KEYS.map((key) => ({
        key,
        label: PLATFORM_META[key].label,
        platform: SOCIAL_ACCOUNTS[key].platform,
        accountName: SOCIAL_ACCOUNTS[key].accountName,
        followers_count: 0,
        total_posts: 0,
      }));
      replace(formEntries);
    } finally {
      setIsLoading(false);
    }
  }, [selectedYear, selectedWeek, replace]);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (mounted) {
      fetchData();
    }
  }, [mounted, fetchData]);

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    try {
      await Promise.all(
        values.entries.map(async (entry) => {
          const existing = existingEntryMap[entry.key];
          const key = entry.key as PlatformKey;
          const calc = autoCalc(key, entry.followers_count, entry.total_posts);
          if (existing) {
            await socialMediaApi.update(existing.id, {
              followers_count: entry.followers_count,
              total_posts: entry.total_posts,
              total_reach: calc.reach,
              total_impressions: calc.impressions,
              engagement_rate: calc.er,
            });
          } else {
            await socialMediaApi.create({
              platform: entry.platform as 'INSTAGRAM' | 'TIKTOK' | 'YOUTUBE' | 'FACEBOOK' | 'TWITTER' | 'BLOG',
              account_name: entry.accountName,
              followers_count: entry.followers_count,
              total_posts: entry.total_posts,
              total_reach: calc.reach,
              total_impressions: calc.impressions,
              engagement_rate: calc.er,
              period_week: selectedWeek,
              period_year: selectedYear,
            });
          }
        })
      );

      toast.success(isUpdateMode ? 'Data media sosial berhasil diperbarui' : 'Data media sosial berhasil disimpan');
      await fetchData();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      toast.error(axiosErr?.response?.data?.message || 'Gagal menyimpan data');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!mounted) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-20 bg-white/10 rounded-xl" />
        <div className="h-96 bg-white/10 rounded-xl" />
      </div>
    );
  }

  const trendWithWeek = trend.map((t) => ({ ...t, week: `W${t.period_week}` }));
  const followersTrend = buildFollowersTrend(trendWithWeek);
  const engagementTrend = buildEngagementTrend(trendWithWeek);

  if (!isAdmin) {
    return (
      <>
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-heading font-bold text-[var(--galactic-diamond)]">Media Sosial</h2>
            <p className="text-[var(--galactic-diamond)]/60 text-sm mt-1">Pantau pertumbuhan dan engagement di semua platform</p>
          </div>
          <SocialMediaFollowersChart data={followersTrend} />
          <SocialMediaEngagementChart data={engagementTrend} />
        </div>
      </>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-heading font-bold text-[var(--galactic-diamond)]">Input Kinerja Media Sosial</h2>
          <p className="text-[var(--galactic-diamond)]/60 text-sm mt-1">
            Masukkan jumlah followers dan postingan setiap platform per minggu
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <BarChart3 className="h-4 w-4 text-[var(--galactic-aurora-soft)]" />
          <span className="text-[var(--galactic-diamond)]/60">Reach, Impressions & ER dihitung otomatis</span>
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex flex-wrap items-center gap-3 bg-white/5 rounded-xl border border-white/10 p-3 shadow-[0_0_15px_rgba(255,255,255,0.05)]">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-[var(--galactic-diamond)]/60">Tahun:</label>
          <select
            value={selectedYear}
            onChange={(e) => setYear(Number(e.target.value))}
            className="border border-white/10 rounded-lg px-3 py-1.5 text-sm bg-white/5 text-[var(--galactic-diamond)] focus:outline-none focus:ring-2 focus:ring-[var(--galactic-aurora)]"
          >
            {[2024, 2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <div className="h-5 w-px bg-white/10" />
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setWeek(selectedWeek - 1)} className="h-8 w-8 p-0">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-semibold text-[var(--galactic-diamond)] min-w-[100px] text-center">
            Minggu {selectedWeek}
          </span>
          <Button type="button" variant="outline" size="sm" onClick={() => setWeek(selectedWeek + 1)} className="h-8 w-8 p-0">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-white/10 rounded-lg w-1/3" />
          <div className="h-96 bg-white/10 rounded-xl" />
        </div>
      ) : (
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <GlassCard className="shadow-[0_0_15px_rgba(255,255,255,0.05)] border border-white/10">
            <GlassCardHeader className="pb-2">
              <GlassCardTitle className="text-base font-semibold text-[var(--galactic-diamond)] flex items-center">
                <span>Kinerja Media Sosial — {fields.length} Platform</span>
                <Button type="button" variant="ghost" size="icon" className="ml-2 h-6 w-6" onClick={fetchData} disabled={isLoading} aria-label="Refresh">
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
              </GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-4 font-semibold text-[var(--galactic-diamond)]/60 w-8">#</th>
                      <th className="text-left py-3 px-4 font-semibold text-[var(--galactic-diamond)]/60">Platform</th>
                      <th className="text-left py-3 px-4 font-semibold text-[var(--galactic-diamond)]/60 w-36">Followers</th>
                      <th className="text-left py-3 px-4 font-semibold text-[var(--galactic-diamond)]/60 w-36">Total Posts</th>
                      <th className="text-left py-3 px-4 font-semibold text-[var(--galactic-diamond)]/60">Estimasi (otomatis)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fields.map((field, index) => (
                      <tr key={field.id} className="border-b border-white/5 hover:bg-white/[0.02]/50 transition-colors">
                        <td className="py-3 px-4 text-[var(--galactic-diamond)]/60 font-mono">{index + 1}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {(() => {
                              const key = form.getValues(`entries.${index}.key`) as PlatformKey;
                              const meta = PLATFORM_META[key];
                              const Icon = meta?.icon || FileText;
                              return (
                                <>
                                  <div className={`p-1.5 rounded-lg ${meta?.bg || 'bg-white/[0.02]'}`}>
                                    <Icon className={`h-4 w-4 ${meta?.color || 'text-[var(--galactic-diamond)]/60'}`} />
                                  </div>
                                  <span className="font-medium text-[var(--galactic-diamond)]">{form.getValues(`entries.${index}.label`)}</span>
                                </>
                              );
                            })()}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Input
                            type="number"
                            min={0}
                            className="w-28 h-9"
                            {...form.register(`entries.${index}.followers_count`, { valueAsNumber: true })}
                          />
                        </td>
                        <td className="py-3 px-4">
                          <Input
                            type="number"
                            min={0}
                            className="w-28 h-9"
                            {...form.register(`entries.${index}.total_posts`, { valueAsNumber: true })}
                          />
                        </td>
                        <td className="py-3 px-4">
                          <CalcCell control={form.control} index={index} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end mt-6 pt-4 border-t border-white/10">
                <Button type="submit" disabled={isSubmitting} className="bg-[var(--galactic-aurora)] hover:bg-[var(--galactic-cosmic)] px-8">
                  {isSubmitting ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Menyimpan...</>
                  ) : (
                    <><Save className="mr-2 h-4 w-4" />{isUpdateMode ? 'Update' : 'Simpan Semua'}</>
                  )}
                </Button>
              </div>
            </GlassCardContent>
          </GlassCard>
        </form>
      )}

      <SocialMediaFollowersChart data={followersTrend} />
      <SocialMediaEngagementChart data={engagementTrend} />
    </div>
  );
}
