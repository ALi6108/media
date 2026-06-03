import type { PlatformKey } from '@/lib/constants/social-links';

interface PlatformMetrics {
  followers_count: number;
  followers_growth: number;
  total_posts: number;
  total_reach: number;
  total_impressions: number;
  engagement_rate: number;
}

interface SummaryData {
  period_week: number;
  period_year: number;
  period_label: string;
  platforms: Record<PlatformKey, PlatformMetrics> | null;
  total_followers: number;
  total_followers_growth: number;
  avg_engagement_rate: number;
}

interface TrendItem {
  id: string;
  platform: PlatformKey;
  period_week: number;
  period_year: number;
  period_label: string;
  followers_count: number;
  followers_growth: number;
  total_posts: number;
  total_reach: number;
  total_impressions: number;
  engagement_rate: number;
  created_at: string;
}

const zeroMetrics: Record<PlatformKey, PlatformMetrics> = {
  IG_IPNU: { followers_count: 0, followers_growth: 0, total_posts: 0, total_reach: 0, total_impressions: 0, engagement_rate: 0 },
  IG_IPPNU: { followers_count: 0, followers_growth: 0, total_posts: 0, total_reach: 0, total_impressions: 0, engagement_rate: 0 },
  YOUTUBE: { followers_count: 0, followers_growth: 0, total_posts: 0, total_reach: 0, total_impressions: 0, engagement_rate: 0 },
  TIKTOK: { followers_count: 0, followers_growth: 0, total_posts: 0, total_reach: 0, total_impressions: 0, engagement_rate: 0 },
  BLOG: { followers_count: 0, followers_growth: 0, total_posts: 0, total_reach: 0, total_impressions: 0, engagement_rate: 0 },
};

export const mockSummary: SummaryData = {
  period_week: 1,
  period_year: 2026,
  period_label: 'W1 2026',
  platforms: zeroMetrics,
  total_followers: 0,
  total_followers_growth: 0,
  avg_engagement_rate: 0,
};

export const mockTrend: TrendItem[] = [];
