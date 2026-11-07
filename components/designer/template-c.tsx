'use client';

import React from 'react';

export interface TemplateCProps {
  headline: string;
  tweetQuote: string;
  tweetAuthorHandle?: string | null;
  tweetAuthorName?: string | null;
  sourceOutlet?: string | null;
  aspectRatio: '4:5' | '1:1';
  handle?: string;
}

export function TemplateC({
  headline,
  tweetQuote,
  tweetAuthorHandle = '@user',
  tweetAuthorName = 'Official Source',
  sourceOutlet,
  aspectRatio = '4:5',
  handle = '@newscreator',
}: TemplateCProps) {
  const isSquare = aspectRatio === '1:1';
  const width = 1080;
  const height = isSquare ? 1080 : 1350;

  return (
    <div
      style={{
        width: `${width}px`,
        height: `${height}px`,
        backgroundColor: '#FAF7F0',
        color: '#1A1814',
      }}
      className="relative overflow-hidden p-[72px] flex flex-col justify-between select-none"
    >
      {/* Inset Border (48px from edge) */}
      <div className="absolute inset-[48px] border border-[#CFC6B2] pointer-events-none rounded-[2px]" />

      {/* Top Header: Inter headline explaining why it matters */}
      <div className="relative z-10 pt-2">
        <div className="font-mono text-[20px] uppercase tracking-[0.1em] text-[#B8501A] font-medium mb-3">
          VERIFIED REACTION · VIA X
        </div>
        <h2 className="font-inter text-[44px] font-semibold text-[#1A1814] leading-tight">
          {headline}
        </h2>
      </div>

      {/* Center Quote Area: Fraunces Italic */}
      <div className="relative z-10 my-auto py-6">
        <blockquote
          style={{
            fontFamily: 'var(--font-fraunces), serif',
            fontStyle: 'italic',
            fontSize: '58px',
            lineHeight: 1.25,
          }}
          className="text-[#1A1814] max-w-[936px]"
        >
          "{tweetQuote || 'Important statement regarding the ongoing situation.'}"
        </blockquote>

        {/* Tweet Author Details in Mono */}
        <div className="mt-8 flex items-center gap-3 font-mono text-[24px]">
          <span className="font-semibold text-[#1A1814]">{tweetAuthorName}</span>
          <span className="text-[#7A7364]">{tweetAuthorHandle}</span>
        </div>
      </div>

      {/* Bottom Footer Credit */}
      <div className="relative z-10 pt-6 border-t border-[#CFC6B2] flex items-center justify-between font-mono text-[20px] text-[#7A7364]">
        <span>SOURCE: {sourceOutlet ? sourceOutlet.toUpperCase() : 'X / PUBLIC STATEMENT'}</span>
        <span>{handle}</span>
      </div>
    </div>
  );
}

