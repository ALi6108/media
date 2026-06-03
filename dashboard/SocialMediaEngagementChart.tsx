'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import type { PlatformKey } from '@/lib/constants/social-links';
import { PLATFORM_KEYS } from '@/lib/constants/social-links';

const PLATFORM_META: Record<PlatformKey, { label: string }> = {
  IG_IPNU: { label: 'IG IPNU' },
  IG_IPPNU: { label: 'IG IPPNU' },
  YOUTUBE: { label: 'YouTube' },
  TIKTOK: { label: 'TikTok' },
  BLOG: { label: 'Blog' },
};

const CHART_COLORS: Record<PlatformKey, string> = {
  IG_IPNU: '#ec4899',
  IG_IPPNU: '#d946ef',
  YOUTUBE: '#ef4444',
  TIKTOK: '#1e293b',
  BLOG: '#2563eb',
};

interface DataEntry {
  week: string;
  [key: string]: string | number;
}

interface Props {
  data: DataEntry[];
  title?: string;
}

export function SocialMediaEngagementChart({ data, title = 'Engagement Rate (%)' }: Props) {
  const hasData = data.length > 0 && PLATFORM_KEYS.some((k) => data.some((d) => (d[k] as number || 0) > 0));

  return (
    <Card className="shadow-sm border border-slate-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-slate-700">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          {hasData ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="week" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                {PLATFORM_KEYS.filter((k) => data.some((d) => (d[k] as number || 0) > 0)).map((key) => (
                  <Bar
                    key={key}
                    dataKey={key}
                    name={PLATFORM_META[key].label}
                    fill={CHART_COLORS[key]}
                    radius={[4, 4, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400">
              Belum ada data engagement
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
