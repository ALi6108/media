export interface SocialMediaMetrics {
  id?: string;
  platform: string;
  accountName?: string;
  date: string;
  followers: number;
  followersChange: number;
  reach: number;
  engagementRate: number;
  posts: number;
  createdAt?: string;
}

export interface EventRecord {
  id?: string;
  title: string;
  description: string;
  date: string;
  category: string;
  status: 'upcoming' | 'ongoing' | 'completed';
  createdAt?: string;
}
