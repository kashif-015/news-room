'use client';

import React from 'react';
import { ExternalLink } from 'lucide-react';

interface SearchOnXProps {
  headline: string;
}

export function SearchOnX({ headline }: SearchOnXProps) {
  // Extract key search words from headline
  const keywords = React.useMemo(() => {
    return headline
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((word) => word.length > 3)
      .slice(0, 4)
      .join(' ');
  }, [headline]);

  const xUrl = `https://x.com/search?q=${encodeURIComponent(keywords)}&f=top`;

  return (
    <a
      href={xUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center justify-between w-full p-2.5 bg-paper border border-rule rounded-[2px] font-mono text-xs text-ink hover:border-orange hover:text-orange transition-colors"
    >
      <span>Search "{keywords}" on X</span>
      <ExternalLink className="w-3.5 h-3.5 text-ink-mute" />
    </a>
  );
}

