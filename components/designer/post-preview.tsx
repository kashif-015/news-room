'use client';

import React, { useRef, useState, useEffect } from 'react';
import { TemplateA } from './template-a';
import { TemplateB } from './template-b';
import { TemplateC } from './template-c';

export interface PostDesignConfig {
  templateId: 'template-a' | 'template-b' | 'template-c';
  aspectRatio: '4:5' | '1:1';
  imageUrl?: string | null;
  highlightPhrase?: string;
  theme?: 'light' | 'dark';
  tweetQuote?: string;
  tweetHandle?: string;
  tweetName?: string;
}

interface PostPreviewProps {
  headline: string;
  sourceOutlet?: string | null;
  config: PostDesignConfig;
  exportRef: React.RefObject<HTMLDivElement | null>;
}

export function PostPreview({ headline, sourceOutlet, config, exportRef }: PostPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.35);

  const isSquare = config.aspectRatio === '1:1';
  const naturalWidth = 1080;
  const naturalHeight = isSquare ? 1080 : 1350;

  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const availableWidth = containerRef.current.clientWidth - 32;
        const newScale = Math.min(availableWidth / naturalWidth, 0.45);
        setScale(Math.max(0.2, newScale));
      }
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [naturalWidth, naturalHeight]);

  const renderTemplate = () => {
    switch (config.templateId) {
      case 'template-a':
        return (
          <TemplateA
            headline={headline}
            sourceOutlet={sourceOutlet}
            imageUrl={config.imageUrl}
            aspectRatio={config.aspectRatio}
          />
        );
      case 'template-b':
        return (
          <TemplateB
            headline={headline}
            sourceOutlet={sourceOutlet}
            highlightPhrase={config.highlightPhrase}
            theme={config.theme}
            aspectRatio={config.aspectRatio}
          />
        );
      case 'template-c':
        return (
          <TemplateC
            headline={headline}
            sourceOutlet={sourceOutlet}
            tweetQuote={config.tweetQuote || headline}
            tweetAuthorHandle={config.tweetHandle}
            tweetAuthorName={config.tweetName}
            aspectRatio={config.aspectRatio}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div
      ref={containerRef}
      className="w-full flex flex-col items-center justify-center p-4 bg-bone-deep/50 border border-rule rounded-[2px] overflow-hidden"
    >
      {/* Scaled Preview Wrapper */}
      <div
        style={{
          width: `${naturalWidth * scale}px`,
          height: `${naturalHeight * scale}px`,
        }}
        className="relative overflow-hidden shadow-lg transition-all duration-200"
      >
        <div
          ref={exportRef}
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            width: `${naturalWidth}px`,
            height: `${naturalHeight}px`,
          }}
          className="absolute top-0 left-0"
        >
          {renderTemplate()}
        </div>
      </div>

      <div className="mt-3 font-mono text-[11px] text-ink-mute">
        {naturalWidth} × {naturalHeight} px ({config.aspectRatio}) · Scaled to {Math.round(scale * 100)}%
      </div>
    </div>
  );
}

