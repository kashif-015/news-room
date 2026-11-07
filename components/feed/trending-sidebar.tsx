'use client';

import React from 'react';
import Link from 'next/link';
import { Cluster } from '@/lib/shared/types';

interface TrendingSidebarProps {
  clusters: Cluster[];
  selectedClusterId?: string | null;
  onSelectCluster?: (clusterId: string | null) => void;
}

export function TrendingSidebar({ clusters, selectedClusterId, onSelectCluster }: TrendingSidebarProps) {
  if (!clusters || clusters.length === 0) {
    return (
      <div className="border border-rule p-5 bg-paper rounded-[2px]">
        <h3 className="font-mono text-xs uppercase tracking-wider text-ink-mute mb-2">
          Trending Coverage
        </h3>
        <p className="font-inter text-xs text-ink-mute">
          Clusters form automatically as multiple outlets cover the same event.
        </p>
      </div>
    );
  }

  return (
    <aside className="border border-rule p-5 bg-paper rounded-[2px]" aria-labelledby="trending-heading">
      <div className="flex items-center justify-between pb-3 border-b border-rule mb-4">
        <h3 id="trending-heading" className="font-mono text-xs uppercase tracking-wider text-ink-mute">
          Most Covered Right Now
        </h3>
        {selectedClusterId && onSelectCluster && (
          <button
            onClick={() => onSelectCluster(null)}
            className="font-mono text-[11px] text-orange hover:underline"
          >
            Clear
          </button>
        )}
      </div>

      <ol className="space-y-4">
        {clusters.slice(0, 5).map((cluster, index) => {
          const isSelected = selectedClusterId === cluster.id;
          return (
            <li
              key={cluster.id}
              onClick={() => onSelectCluster && onSelectCluster(isSelected ? null : cluster.id)}
              className={`group flex items-start gap-3 cursor-pointer p-1 rounded-[2px] transition-colors ${
                isSelected ? 'bg-bone-deep' : 'hover:bg-bone-deep/50'
              }`}
            >
              {/* Large Fraunces numeral */}
              <span className="font-fraunces text-2xl font-semibold text-ink-mute group-hover:text-orange transition-colors w-6 shrink-0 leading-none pt-0.5">
                {index + 1}
              </span>

              <div className="flex-1 min-w-0">
                <h4 className="font-fraunces text-sm font-semibold text-ink leading-snug line-clamp-2 group-hover:text-orange transition-colors">
                  {cluster.headline}
                </h4>
                <div className="flex items-center gap-2 mt-1 font-mono text-[11px] text-ink-mute">
                  <span className="text-pine font-medium">
                    {cluster.outlet_count} {cluster.outlet_count === 1 ? 'outlet' : 'outlets'}
                  </span>
                  <span>·</span>
                  <span>Score {cluster.trend_score}</span>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </aside>
  );
}

