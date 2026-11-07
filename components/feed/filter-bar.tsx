'use client';

import React from 'react';
import { Chip } from '@/components/ui/chip';
import { CATEGORIES, TIME_RANGES } from '@/lib/shared/constants';

interface FilterBarProps {
  selectedCategory: string | null;
  onSelectCategory: (cat: string | null) => void;
  selectedTimeRange: string;
  onSelectTimeRange: (tr: string) => void;
  unusedOnly: boolean;
  onToggleUnusedOnly: (val: boolean) => void;
  sort: 'trend' | 'newest';
  onToggleSort: (sort: 'trend' | 'newest') => void;
}

export function FilterBar({
  selectedCategory,
  onSelectCategory,
  selectedTimeRange,
  onSelectTimeRange,
  unusedOnly,
  onToggleUnusedOnly,
  sort,
  onToggleSort,
}: FilterBarProps) {
  return (
    <div className="space-y-4 mb-6">
      {/* Categories */}
      <div>
        <span className="block font-mono text-[10px] uppercase tracking-wider text-ink-mute mb-2">
          Category
        </span>
        <div className="flex flex-wrap gap-1.5">
          <Chip
            label="All"
            active={selectedCategory === null}
            onClick={() => onSelectCategory(null)}
          />
          {CATEGORIES.map((cat) => (
            <Chip
              key={cat.id}
              label={cat.label}
              active={selectedCategory === cat.id}
              onClick={() => onSelectCategory(selectedCategory === cat.id ? null : cat.id)}
            />
          ))}
        </div>
      </div>

      {/* Time Range & Sort */}
      <div className="flex items-center justify-between gap-4 pt-3 border-t border-rule flex-wrap">
        <div>
          <span className="block font-mono text-[10px] uppercase tracking-wider text-ink-mute mb-1.5">
            Time Range
          </span>
          <div className="flex gap-1.5 flex-wrap">
            {TIME_RANGES.map((tr) => (
              <Chip
                key={tr.id}
                label={tr.label}
                active={selectedTimeRange === tr.id}
                onClick={() => onSelectTimeRange(tr.id)}
              />
            ))}
          </div>
        </div>

        {/* Sort & Unused */}
        <div className="flex items-center gap-3 self-end pt-2">
          <button
            onClick={() => onToggleUnusedOnly(!unusedOnly)}
            className={`font-mono text-xs px-2.5 py-1 rounded-[2px] border transition-colors ${
              unusedOnly
                ? 'bg-ink text-bone border-ink'
                : 'border-rule text-ink-soft hover:border-ink'
            }`}
          >
            Not yet used
          </button>

          <div className="flex border border-rule rounded-[2px] overflow-hidden font-mono text-xs">
            <button
              onClick={() => onToggleSort('trend')}
              className={`px-2.5 py-1 transition-colors ${
                sort === 'trend'
                  ? 'bg-ink text-bone font-medium'
                  : 'bg-paper text-ink-mute hover:text-ink'
              }`}
            >
              Trending
            </button>
            <button
              onClick={() => onToggleSort('newest')}
              className={`px-2.5 py-1 border-l border-rule transition-colors ${
                sort === 'newest'
                  ? 'bg-ink text-bone font-medium'
                  : 'bg-paper text-ink-mute hover:text-ink'
              }`}
            >
              Newest
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

