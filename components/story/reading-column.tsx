'use client';

import React from 'react';
import { Dateline } from '@/components/ui/dateline';
import { ExternalLink } from 'lucide-react';

interface ReadingColumnProps {
  title: string;
  sourceUrl: string;
  outlet?: string | null;
  category?: string | null;
  publishedAt?: string | null;
  textContent: string;
  isExtracted: boolean;
  warning?: string;
}

export function ReadingColumn({
  title,
  sourceUrl,
  outlet,
  category,
  publishedAt,
  textContent,
  isExtracted,
  warning,
}: ReadingColumnProps) {
  return (
    <article className="bg-paper border border-rule rounded-[2px] p-6 sm:p-8 min-w-0">
      {/* Dateline & Outlet */}
      <div className="flex items-center justify-between pb-3 border-b border-rule mb-4 flex-wrap gap-2">
        <Dateline source={outlet} category={category} date={publishedAt} format="full" />
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 font-mono text-xs text-orange hover:underline"
        >
          <span>Original article</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Headline */}
      <h1 className="font-fraunces text-2xl sm:text-3xl font-semibold text-ink leading-tight tracking-tight mb-6">
        {title}
      </h1>

      {/* Warning banner if extraction had fallback */}
      {warning && (
        <div className="bg-bone-deep p-3 border-l-2 border-orange text-xs font-mono text-ink-soft mb-6">
          {warning}
        </div>
      )}

      {/* Extracted Body Text */}
      <div className="prose prose-stone max-w-none font-inter text-base text-ink leading-relaxed space-y-4">
        {textContent ? (
          textContent.split('\n\n').map((paragraph, index) => (
            <p key={index} className="text-ink-soft">
              {paragraph.trim()}
            </p>
          ))
        ) : (
          <p className="text-ink-mute italic">No article text extracted yet.</p>
        )}
      </div>
    </article>
  );
}

