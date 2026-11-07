'use client';

import React, { useState } from 'react';
import { MediaPanel } from '@/components/story/media-panel';
import { MediaItem } from '@/lib/shared/types';
import { Upload, Image as ImageIcon } from 'lucide-react';

interface BackgroundPickerProps {
  currentImageUrl?: string | null;
  onSelectImage: (url: string | null) => void;
  category?: string;
}

export function BackgroundPicker({
  currentImageUrl,
  onSelectImage,
  category = 'news',
}: BackgroundPickerProps) {
  const [mode, setMode] = useState<'photos' | 'upload' | 'none'>('photos');

  const handleMediaSelect = (item: MediaItem) => {
    // Wrap through server image proxy to guarantee CORS safety during canvas export
    const proxyUrl = `/api/images/proxy?url=${encodeURIComponent(item.fullUrl)}`;
    onSelectImage(proxyUrl);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          onSelectImage(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-rule">
        <span className="font-mono text-xs uppercase tracking-wider text-ink-mute">
          Post Background
        </span>
        {currentImageUrl && (
          <button
            onClick={() => onSelectImage(null)}
            className="font-mono text-[11px] text-alert hover:underline"
          >
            Clear image
          </button>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setMode('photos')}
          className={`flex-1 py-1.5 px-3 font-mono text-xs border rounded-[2px] transition-colors ${
            mode === 'photos'
              ? 'bg-ink text-bone border-ink'
              : 'bg-paper text-ink-soft border-rule hover:border-ink'
          }`}
        >
          Photo Library
        </button>
        <button
          onClick={() => setMode('upload')}
          className={`flex-1 py-1.5 px-3 font-mono text-xs border rounded-[2px] transition-colors ${
            mode === 'upload'
              ? 'bg-ink text-bone border-ink'
              : 'bg-paper text-ink-soft border-rule hover:border-ink'
          }`}
        >
          Upload Photo
        </button>
      </div>

      {mode === 'photos' && (
        <div className="pt-2">
          <MediaPanel initialQuery={category} onSelectMedia={handleMediaSelect} />
        </div>
      )}

      {mode === 'upload' && (
        <div className="border border-dashed border-rule p-6 text-center bg-paper rounded-[2px]">
          <label className="cursor-pointer flex flex-col items-center">
            <Upload className="w-6 h-6 text-ink-mute mb-2" />
            <span className="font-mono text-xs text-orange font-medium hover:underline">
              Choose an image from your device
            </span>
            <span className="font-inter text-[11px] text-ink-mute mt-1">
              JPG or PNG. Text never covers faces when you use Template A.
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="sr-only"
            />
          </label>
        </div>
      )}
    </div>
  );
}

