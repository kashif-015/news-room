'use client';

import React from 'react';
import Link from 'next/link';
import { Dateline } from '@/components/ui/dateline';
import { ArticleWithCluster } from '@/lib/shared/types';

interface StoryRowProps {
  article: ArticleWithCluster;
  onMarkUsed?: (id: string, used: boolean) => void;
}

export function StoryRow({ article }: StoryRowProps) {
  const outletCount = article.cluster?.outlet_count || 1;
  const isWellCovered = outletCount >= 3;

  return (
    <article
      data-cursor-label="Read"
      className={`group relative py-4 px-3 sm:px-4 transition-all duration-150 [transition-timing-function:cubic-bezier(0.2,0.7,0.2,1)] ${
        article.used ? 'opacity-65 hover:opacity-100' : 'hover:bg-bone-deep/40'
      }`}
    >
      {/* 2px orange indicator bar on hover */}
      <span
        className="absolute left-0 top-0 bottom-0 w-[2px] bg-orange opacity-0 group-hover:opacity-100 transition-opacity duration-150"
        aria-hidden="true"
      />

      <div className="transition-transform duration-150 group-hover:translate-x-0.5">
        {/* Top metadata line: Dateline + Status Tags */}
        <div className="flex items-center justify-between gap-3 mb-1.5 flex-wrap">
          <Dateline
            source={article.outlet || article.source?.name || 'News Source'}
            category={article.category}
            date={article.published_at || article.fetched_at}
          />

          <div className="flex items-center gap-2">
            {/* Coverage badge */}
            {isWellCovered && (
              <span className="font-mono text-[11px] font-medium text-pine bg-pine-wash/60 px-2 py-0.5 rounded-[2px] border border-pine/30">
                Covered by {outletCount} outlets
              </span>
            )}

            {/* Used status badge */}
            {article.used && (
              <span className="font-mono text-[11px] text-ink-mute line-through uppercase tracking-wider">
                Used
              </span>
            )}
          </div>
        </div>

        {/* Headline */}
        <h2 className="font-fraunces text-lg sm:text-xl font-semibold text-ink leading-snug tracking-tight mb-1 group-hover:text-orange transition-colors">
          <Link href={`/story/${article.id}`} className="focus:outline-none">
            {article.title}
          </Link>
        </h2>

        {/* One-line editorial summary */}
        {article.summary && (
          <p className="font-inter text-sm text-ink-soft line-clamp-2 leading-relaxed">
            {article.summary}
          </p>
        )}
      </div>
    </article>
  );
}

