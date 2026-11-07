'use client';

import React from 'react';

export interface TemplateAProps {
  headline: string;
  sourceOutlet?: string | null;
  category?: string | null;
  dateStr?: string;
  imageUrl?: string | null;
  aspectRatio: '4:5' | '1:1';
  handle?: string;
  overlayOpacity?: number; // 0.55 - 0.70
}

export function TemplateA({
  headline,
  sourceOutlet,
  category = 'GENERAL',
  dateStr,
  imageUrl,
  aspectRatio = '4:5',
  handle = '@newscreator',
  overlayOpacity = 0.62,
}: TemplateAProps) {
  const isSquare = aspectRatio === '1:1';
  const width = 1080;
  const height = isSquare ? 1080 : 1350;

  // Responsive font size based on headline length
  const fontSize = headline.length > 90 ? '76px' : headline.length > 50 ? '88px' : '98px';

  return (
    <div
      style={{
        width: `${width}px`,
        height: `${height}px`,
        backgroundColor: '#1A1814',
      }}
      className="relative overflow-hidden flex flex-col justify-between p-[72px] text-[#F3EEE3] select-none"
    >
      {/* Background Image with Ink Overlay */}
      {imageUrl && (
        <img
          src={imageUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover z-0"
        />
      )}

      {/* Dark ink overlay */}
      <div
        className="absolute inset-0 bg-[#1A1814] z-1"
        style={{ opacity: overlayOpacity }}
      />

      {/* Subtle paper grain */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#1A1814] via-transparent to-transparent opacity-80 z-2" />

      {/* Top Header Label */}
      <div className="relative z-10 flex items-center justify-between font-mono text-[22px] tracking-[0.1em] uppercase text-[#F3EEE3]/80">
        <span className="font-semibold text-[#B8501A]">{category}</span>
        <span>{dateStr || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
      </div>

      {/* Bottom Area: Orange Bar + Headline + Source */}
      <div className="relative z-10 space-y-8">
        {/* Short orange bar: 96px wide, 6px thick */}
        <div
          style={{ width: '96px', height: '6px', backgroundColor: '#B8501A' }}
          className="rounded-[1px]"
        />

        {/* Fraunces 600 headline */}
        <h1
          style={{
            fontFamily: 'var(--font-fraunces), serif',
            fontSize,
            lineHeight: 1.15,
            fontWeight: 600,
          }}
          className="text-[#F3EEE3] tracking-tight max-w-[936px]"
        >
          {headline}
        </h1>

        {/* Footer Credit Line */}
        <div className="pt-6 border-t border-[#F3EEE3]/20 flex items-center justify-between font-mono text-[20px] text-[#F3EEE3]/70">
          <span>SOURCE: {sourceOutlet ? sourceOutlet.toUpperCase() : 'VERIFIED REPORT'}</span>
          <span>{handle}</span>
        </div>
      </div>
    </div>
  );
}

