'use client';

import React from 'react';

export type StatusType = 'pine' | 'orange' | 'alert' | 'ok' | 'stale' | 'error';

interface StatusDotProps {
  status: StatusType;
  label?: string;
  className?: string;
  pulse?: boolean;
}

export function StatusDot({ status, label, className = '', pulse = false }: StatusDotProps) {
  const colorMap: Record<StatusType, { bg: string; text: string }> = {
    pine: { bg: 'bg-pine', text: 'Verified / OK' },
    ok: { bg: 'bg-pine', text: 'Active' },
    orange: { bg: 'bg-orange', text: 'Warning / Stale' },
    stale: { bg: 'bg-orange', text: 'Stale' },
    alert: { bg: 'bg-alert', text: 'Error' },
    error: { bg: 'bg-alert', text: 'Error' },
  };

  const { bg, text } = colorMap[status] || colorMap.pine;

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span className="relative flex h-2 w-2">
        {pulse && (
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full ${bg} opacity-75`}
          />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${bg}`} />
      </span>
      {label && <span className="font-mono text-xs text-ink-mute">{label}</span>}
      <span className="sr-only">{label || text}</span>
    </span>
  );
}

