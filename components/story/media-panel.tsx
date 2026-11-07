'use client';

import React, { useState, useEffect } from 'react';
import { Tabs } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { MediaItem } from '@/lib/shared/types';
import { ExternalLink, Check } from 'lucide-react';

interface MediaPanelProps {
  initialQuery: string;
  onSelectMedia?: (item: MediaItem) => void;
  selectedMediaId?: string;
}

export function MediaPanel({ initialQuery, onSelectMedia, selectedMediaId }: MediaPanelProps) {
  const [activeTab, setActiveTab] = useState<'memes' | 'gifs' | 'photos'>('memes');
  const [query, setQuery] = useState(initialQuery);
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);

  const searchMedia = async (tab: 'memes' | 'gifs' | 'photos', q: string) => {
    setLoading(true);
    setWarning(null);

    const endpointMap = {
      memes: `/api/memes/search?q=${encodeURIComponent(q)}`,
      gifs: `/api/gifs/search?q=${encodeURIComponent(q)}`,
      photos: `/api/images/search?q=${encodeURIComponent(q)}`,
    };

    try {
      const res = await fetch(endpointMap[tab]);
      const data = await res.json();
      setItems(data.results || []);
      if (data.warning) setWarning(data.warning);
    } catch {
      setItems([]);
      setWarning('Unable to fetch media provider.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    searchMedia(activeTab, query);
  }, [activeTab]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    searchMedia(activeTab, query);
  };

  return (
    <div className="space-y-3">
      {/* Tabs */}
      <Tabs
        tabs={[
          { id: 'memes', label: 'Memes' },
          { id: 'gifs', label: 'GIFs' },
          { id: 'photos', label: 'Photos' },
        ]}
        activeTab={activeTab}
        onChange={(id: string) => setActiveTab(id as 'memes' | 'gifs' | 'photos')}
      />

      {/* Search Input */}
      <form onSubmit={handleSearchSubmit}>
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${activeTab}...`}
          className="text-xs"
        />
      </form>

      {/* Warning/Provider Status */}
      {warning && (
        <div className="font-mono text-[11px] text-ink-mute bg-bone p-2 border border-rule rounded-[2px]">
          {warning}
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 gap-2 py-4">
          <div className="h-28 bg-rule/30 rounded-[2px] animate-pulse" />
          <div className="h-28 bg-rule/30 rounded-[2px] animate-pulse" />
        </div>
      ) : items.length === 0 ? (
        <p className="font-inter text-xs text-ink-mute py-4 text-center">
          No {activeTab} found for "{query}".
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-1">
          {items.map((item) => {
            const isSelected = selectedMediaId === item.id;
            return (
              <div
                key={item.id}
                onClick={() => onSelectMedia && onSelectMedia(item)}
                className={`group relative border rounded-[2px] overflow-hidden cursor-pointer bg-bone transition-all ${
                  isSelected ? 'border-orange ring-1 ring-orange' : 'border-rule hover:border-ink'
                }`}
              >
                <img
                  src={item.thumbUrl}
                  alt={item.title}
                  loading="lazy"
                  className="w-full h-24 object-cover"
                />

                {isSelected && (
                  <span className="absolute top-1 right-1 bg-orange text-paper rounded-full p-0.5">
                    <Check className="w-3 h-3" />
                  </span>
                )}

                <div className="p-1.5 bg-paper/95 text-[10px] font-mono text-ink-mute truncate">
                  <a
                    href={item.creditUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="hover:text-orange hover:underline truncate block"
                  >
                    {item.credit}
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
