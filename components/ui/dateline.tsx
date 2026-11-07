'use client';

import React from 'react';

export interface DatelineProps {
  date?: string | Date | null;
  source?: string | null;
  category?: string | null;
  className?: string;
  format?: 'full' | 'relative' | 'short';
}

export function Dateline({
  date,
  source,
  category,
  className = '',
  format = 'relative',
}: DatelineProps) {
  const formattedDate = React.useMemo(() => {
    if (!date) return null;
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;

    if (format === 'full') {
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }

    if (format === 'relative') {
      const diffMs = Date.now() - d.getTime();
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHr = Math.floor(diffMin / 60);
      const diffDay = Math.floor(diffHr / 24);

      if (diffSec < 60) return 'just now';
      if (diffMin < 60) return `${diffMin}m ago`;
      if (diffHr < 24) return `${diffHr}h ago`;
      if (diffDay < 7) return `${diffDay}d ago`;
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    }

    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }, [date, format]);

  return (
    <div
      className={`font-mono text-xs uppercase tracking-[0.08em] text-ink-mute flex items-center gap-1.5 flex-wrap ${className}`}
    >
      {source && <span className="font-medium text-ink-soft">{source}</span>}
      {source && (category || formattedDate) && <span className="text-rule">·</span>}
      {category && <span className="text-ink-mute">{category}</span>}
      {category && formattedDate && <span className="text-rule">·</span>}
      {formattedDate && <span>{formattedDate}</span>}
    </div>
  );
}

