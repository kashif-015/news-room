import type { Metadata } from 'next';
import { WireClient } from './wire-client';

export const metadata: Metadata = {
  title: 'Live Wire · Latest News',
  description:
    'Near-real-time news aggregator across India and World — 60+ sources tracked.',
};

// Mock stats for Step 1 (real data in Step 3)
const MOCK_STATS = {
  sourceCount: 63,
  storiesLast24h: 847,
  lastCheckedMin: 2,
};

export default function WirePage() {
  return <WireClient stats={MOCK_STATS} />;
}
