import { NextRequest, NextResponse } from 'next/server';

function detectPlatform(url: string): string | null {
  if (url.includes('instagram.com')) return 'INSTAGRAM';
  if (url.includes('tiktok.com')) return 'TIKTOK';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'YOUTUBE';
  if (url.includes('blogspot.com') || url.includes('blogger.com')) return 'BLOG';
  return null;
}

function extractUsername(url: string, platform: string): string | null {
  try {
    const u = new URL(url.startsWith('http') ? url : `https://${url}`);
    const parts = u.pathname.replace(/\/$/, '').split('/');
    const last = parts[parts.length - 1] || '';
    if (platform === 'INSTAGRAM') return last.replace(/[?#].*$/, '');
    if (platform === 'TIKTOK') return last.replace(/^@/, '').replace(/[?#].*$/, '');
    if (platform === 'YOUTUBE') return last.replace(/^@/, '').replace(/[?#].*$/, '') || u.searchParams.get('channel') || '';
    if (platform === 'BLOG') return u.hostname.replace('.blogspot.com', '');
    return last;
  } catch {
    return url.trim();
  }
}

async function fetchFromTikTok(username: string) {
  const res = await fetch(`https://www.tiktok.com/@${username}`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
  });
  const html = await res.text();
  const followerMatch = html.match(/"followerCount":(\d+)/);
  const videoMatch = html.match(/"videoCount":(\d+)/);
  const heartMatch = html.match(/"heartCount":(\d+)/);
  return {
    followers_count: followerMatch ? parseInt(followerMatch[1]) : 0,
    total_posts: videoMatch ? parseInt(videoMatch[1]) : 0,
    engagement_rate: heartMatch && followerMatch ? parseFloat(((parseInt(heartMatch[1]) / parseInt(followerMatch[1])) / 100).toFixed(1)) : undefined,
  };
}

async function fetchFromYouTube(handle: string) {
  const res = await fetch(`https://www.youtube.com/@${handle}`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
  });
  const html = await res.text();
  const channelIdMatch = html.match(/"channelId"\s*:\s*"([^"]+)"/) || html.match(/"externalId"\s*:\s*"([^"]+)"/);
  const channelId = channelIdMatch ? channelIdMatch[1] : null;

  let videosCount = 0;
  if (channelId) {
    try {
      const feedRes = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`);
      const xml = await feedRes.text();
      videosCount = (xml.match(/<entry>/g) || []).length;
    } catch {}
  }

  return {
    followers_count: 0,
    total_posts: videosCount,
    channelId,
  };
}

async function fetchFromBlogspot(subdomain: string) {
  const urls = [
    `https://${subdomain}.blogspot.com/feeds/posts/default?max-results=0`,
    `https://www.${subdomain}.blogspot.com/feeds/posts/default?max-results=0`,
  ];
  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        const xml = await res.text();
        const totalMatch = xml.match(/<openSearch:totalResults>(\d+)<\/openSearch:totalResults>/);
        return { followers_count: 0, total_posts: totalMatch ? parseInt(totalMatch[1]) : 0, engagement_rate: undefined };
      }
    } catch {}
  }
  return { followers_count: 0, total_posts: 0, engagement_rate: undefined };
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    if (!url) {
      return NextResponse.json({ success: false, message: 'URL diperlukan' }, { status: 400 });
    }

    const platform = detectPlatform(url);
    if (!platform) {
      return NextResponse.json({ success: false, message: 'Platform tidak dikenal' }, { status: 400 });
    }

    const username = extractUsername(url, platform);
    let data = { followers_count: 0, total_posts: 0, engagement_rate: undefined as number | undefined };

    if (platform === 'TIKTOK' && username) {
      data = await fetchFromTikTok(username);
    } else if (platform === 'YOUTUBE' && username) {
      const ytData = await fetchFromYouTube(username);
      data.followers_count = ytData.followers_count;
      data.total_posts = ytData.total_posts;
    } else if (platform === 'BLOG' && username) {
      data = await fetchFromBlogspot(username);
    } else if (platform === 'INSTAGRAM') {
      data = { followers_count: 0, total_posts: 0, engagement_rate: undefined };
    }

    return NextResponse.json({
      success: true,
      data: {
        platform,
        username,
        url,
        ...data,
      },
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: String(err) }, { status: 500 });
  }
}
