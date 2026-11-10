import type { Metadata } from 'next';
import { WireClient } from './wire-client';
import { getWireFeed } from '@/lib/server/wire/feed';

export const metadata: Metadata = {
  title: 'Live Wire · Latest News',
  description:
    'Near-real-time news aggregator across India and World — 60+ sources tracked.',
};

export const dynamic = 'force-dynamic';

export default async function WirePage() {
  let initialStats = {
    sourceCount: 60,
    storiesLast24h: 0,
    lastCheckedMin: 1,
  };

  try {
    const feed = await getWireFeed();
    if (feed && feed.stats) {
      initialStats = feed.stats;
    }
  } catch {
    // Graceful fallback for initial stats
  }

  return <WireClient initialStats={initialStats} />;
}
