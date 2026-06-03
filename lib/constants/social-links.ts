export type PlatformKey = 'IG_IPNU' | 'IG_IPPNU' | 'YOUTUBE' | 'TIKTOK' | 'BLOG';

export interface SocialAccount {
  key: PlatformKey;
  platform: string;
  accountName: string;
  label: string;
  username: string;
  url: string;
}

export const SOCIAL_ACCOUNTS: Record<PlatformKey, SocialAccount> = {
  IG_IPNU: {
    key: 'IG_IPNU',
    platform: 'INSTAGRAM',
    accountName: 'ipnu_kabmalang',
    label: 'IG IPNU',
    username: '@ipnu_kabmalang',
    url: 'https://www.instagram.com/ipnu_kabmalang',
  },
  IG_IPPNU: {
    key: 'IG_IPPNU',
    platform: 'INSTAGRAM',
    accountName: 'ippnu_kabmalang',
    label: 'IG IPPNU',
    username: '@ippnu_kabmalang',
    url: 'https://www.instagram.com/ippnu_kabmalang',
  },
  YOUTUBE: {
    key: 'YOUTUBE',
    platform: 'YOUTUBE',
    accountName: 'pelajarnukabmalang',
    label: 'YouTube',
    username: '@pelajarnukabmalang',
    url: 'https://youtube.com/@pelajarnukabmalang',
  },
  TIKTOK: {
    key: 'TIKTOK',
    platform: 'TIKTOK',
    accountName: 'pelajarnu_kabmalang',
    label: 'TikTok',
    username: '@pelajarnu_kabmalang',
    url: 'https://www.tiktok.com/@pelajarnu_kabmalang',
  },
  BLOG: {
    key: 'BLOG',
    platform: 'BLOG',
    accountName: 'teraspelajarnukabmalang',
    label: 'Blog',
    username: 'teraspelajarnukabmalang',
    url: 'https://teraspelajarnukabmalang.blogspot.com',
  },
};

export const PLATFORM_KEYS: PlatformKey[] = ['IG_IPNU', 'IG_IPPNU', 'YOUTUBE', 'TIKTOK', 'BLOG'];
