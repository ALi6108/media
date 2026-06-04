'use client';

import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from '@/components/ui/glass-card';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
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
  IG_IPNU: '#60a5fa', // blue
  IG_IPPNU: '#f472b6', // pink
  YOUTUBE: '#ffffff', // white
  TIKTOK: '#3b82f6', // blue darker
  BLOG: '#ec4899', // pink darker
};

interface DataEntry {
  week: string;
  [key: string]: string | number;
}

interface Props {
  data: DataEntry[];
  title?: string;
}

export function SocialMediaFollowersChart({ data, title = 'Tren Pertumbuhan Followers' }: Props) {
  const hasData = data.length > 0 && PLATFORM_KEYS.some((k) => data.some((d) => (d[k] as number || 0) > 0));

  return (
    <GlassCard>
      <GlassCardHeader className="pb-2">
        <GlassCardTitle className="text-base">{title}</GlassCardTitle>
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
                    fontSize: '12px' 
                  }}
                  itemStyle={{ color: '#e8e0f0' }} 
                />
                <Legend wrapperStyle={{ fontSize: '12px', color: 'rgba(232,224,240,0.8)' }} />
                {PLATFORM_KEYS.filter((k) => data.some((d) => (d[k] as number || 0) > 0)).map((key) => (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    name={PLATFORM_META[key].label}
                    stroke={CHART_COLORS[key]}
                    strokeWidth={3}
                    dot={{ r: 4, strokeWidth: 2, fill: '#120825', stroke: CHART_COLORS[key] }}
                    activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff', fill: CHART_COLORS[key] }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-[var(--galactic-diamond)]/60">
              Belum ada data followers
            </div>
          )}
        </div>
      </GlassCardContent>
    </GlassCard>
  );
}
