'use client';

import React from 'react';

export interface TemplateBProps {
  headline: string;
  sourceOutlet?: string | null;
  highlightPhrase?: string;
  theme?: 'light' | 'dark';
  aspectRatio: '4:5' | '1:1';
  handle?: string;
}

export function TemplateB({
  headline,
  sourceOutlet,
  highlightPhrase,
  theme = 'light',
  aspectRatio = '4:5',
  handle = '@newscreator',
}: TemplateBProps) {
  const isSquare = aspectRatio === '1:1';
  const width = 1080;
  const height = isSquare ? 1080 : 1350;

  const isLight = theme === 'light';
  const bg = isLight ? '#FAF7F0' : '#1A1814';
  const textColor = isLight ? '#1A1814' : '#F3EEE3';
  const ruleColor = isLight ? '#CFC6B2' : '#3A352C';
  const muteColor = isLight ? '#7A7364' : '#988F7B';

  const fontSize = headline.length > 80 ? '94px' : headline.length > 45 ? '112px' : '128px';

  // Render headline with optional orange underline highlight
  const renderHighlightedHeadline = () => {
    if (!highlightPhrase || !headline.toLowerCase().includes(highlightPhrase.toLowerCase())) {
      return headline;
    }

    const regex = new RegExp(`(${highlightPhrase})`, 'gi');
    const parts = headline.split(regex);

    return parts.map((part, i) => {
      if (part.toLowerCase() === highlightPhrase.toLowerCase()) {
        return (
          <span
            key={i}
            className="relative inline-block text-[#B8501A] decoration-[#B8501A] underline underline-offset-8"
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div
      style={{
        width: `${width}px`,
        height: `${height}px`,
        backgroundColor: bg,
        color: textColor,
      }}
      className="relative overflow-hidden flex flex-col justify-between p-[72px] select-none"
    >
      {/* Top Folio Header */}
      <div className="flex items-center justify-between font-mono text-[22px] tracking-[0.1em] uppercase" style={{ color: muteColor }}>
        <span>NEWSDESK BRIEF</span>
        <span>{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
      </div>

      {/* Main Massive Headline */}
      <div className="my-auto py-8">
        <h1
          style={{
            fontFamily: 'var(--font-fraunces), serif',
            fontSize,
            lineHeight: 1.1,
            fontWeight: 600,
          }}
          className="tracking-tight"
        >
          {renderHighlightedHeadline()}
        </h1>
      </div>

      {/* Footer Rule & Credits */}
      <div
        style={{ borderColor: ruleColor, color: muteColor }}
        className="pt-6 border-t flex items-center justify-between font-mono text-[20px]"
      >
        <span>SOURCE: {sourceOutlet ? sourceOutlet.toUpperCase() : 'VERIFIED REPORT'}</span>
        <span>{handle}</span>
      </div>
    </div>
  );
}

