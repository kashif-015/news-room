'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';

interface CaptionEditorProps {
  caption: string;
  hashtags: string[];
  onChangeCaption: (newCaption: string) => void;
  onRegenerateMode?: (mode: 'shorter' | 'sharper' | 'more_context') => void;
  isRegenerating?: boolean;
}

export function CaptionEditor({
  caption,
  hashtags,
  onChangeCaption,
  onRegenerateMode,
  isRegenerating = false,
}: CaptionEditorProps) {
  const [copied, setCopied] = useState(false);

  const words = caption.trim() ? caption.trim().split(/\s+/).length : 0;
  const chars = caption.length;

  const handleCopy = () => {
    const fullText = `${caption}\n\n${hashtags.join(' ')}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-3">
      {/* Top Header & Counters */}
      <div className="flex items-center justify-between pb-2 border-b border-rule">
        <span className="font-mono text-xs uppercase tracking-wider text-ink-mute">
          Editorial Caption
        </span>
        <div className="flex items-center gap-3 font-mono text-xs">
          <span className={words < 60 || words > 120 ? 'text-alert' : 'text-pine'}>
            {words} words
          </span>
          <span className="text-rule">·</span>
          <span className="text-ink-mute">{chars} chars</span>
        </div>
      </div>

      {/* Textarea */}
      <textarea
        value={caption}
        onChange={(e) => onChangeCaption(e.target.value)}
        rows={6}
        className="w-full bg-paper border border-rule rounded-[2px] p-3 font-sans text-sm text-ink leading-relaxed placeholder:text-ink-mute focus:outline-none focus:ring-1 focus:ring-orange focus:border-ink"
        placeholder="Type or refine editorial caption..."
      />

      {/* Action Strip: Modes & Copy */}
      <div className="flex items-center justify-between gap-2 flex-wrap pt-1">
        {onRegenerateMode && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <Button
              variant="secondary"
              size="small"
              onClick={() => onRegenerateMode('shorter')}
              disabled={isRegenerating}
            >
              Make shorter
            </Button>
            <Button
              variant="secondary"
              size="small"
              onClick={() => onRegenerateMode('sharper')}
              disabled={isRegenerating}
            >
              Make sharper
            </Button>
            <Button
              variant="secondary"
              size="small"
              onClick={() => onRegenerateMode('more_context')}
              disabled={isRegenerating}
            >
              Add context
            </Button>
          </div>
        )}

        <Button
          variant="secondary"
          size="small"
          onClick={handleCopy}
          leadingIcon={copied ? <Check className="w-3.5 h-3.5 text-pine" /> : <Copy className="w-3.5 h-3.5" />}
        >
          {copied ? 'Copied' : 'Copy caption'}
        </Button>
      </div>

      {/* Hashtags display */}
      {hashtags && hashtags.length > 0 && (
        <div className="pt-3 border-t border-rule font-mono text-xs text-ink-mute flex flex-wrap gap-1.5">
          {hashtags.map((tag, i) => (
            <span key={i} className="text-ink-soft bg-bone px-1.5 py-0.5 rounded-[2px] border border-rule">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

