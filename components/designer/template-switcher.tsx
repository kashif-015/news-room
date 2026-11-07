'use client';

import React from 'react';
import { TEMPLATES } from '@/lib/shared/constants';

interface TemplateSwitcherProps {
  activeTemplateId: string;
  onChangeTemplate: (id: 'template-a' | 'template-b' | 'template-c') => void;
  aspectRatio: '4:5' | '1:1';
  onChangeAspectRatio: (ratio: '4:5' | '1:1') => void;
}

export function TemplateSwitcher({
  activeTemplateId,
  onChangeTemplate,
  aspectRatio,
  onChangeAspectRatio,
}: TemplateSwitcherProps) {
  return (
    <div className="space-y-4">
      {/* Template Selector */}
      <div>
        <label className="block font-mono text-xs uppercase tracking-wider text-ink-mute mb-2">
          Design Template
        </label>
        <div className="grid grid-cols-3 gap-2">
          {TEMPLATES.map((tmpl) => {
            const active = activeTemplateId === tmpl.id;
            return (
              <button
                key={tmpl.id}
                onClick={() => onChangeTemplate(tmpl.id as 'template-a' | 'template-b' | 'template-c')}
                className={`p-2.5 text-left border rounded-[2px] transition-all ${
                  active
                    ? 'border-orange bg-orange-wash/30 ring-1 ring-orange'
                    : 'border-rule bg-paper hover:border-ink'
                }`}
              >
                <div className="font-mono text-[11px] font-semibold text-ink">{tmpl.name}</div>
                <div className="font-inter text-[10px] text-ink-mute line-clamp-1 mt-0.5">
                  {tmpl.description}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Aspect Ratio Switcher */}
      <div className="flex items-center justify-between pt-2 border-t border-rule">
        <span className="font-mono text-xs uppercase tracking-wider text-ink-mute">
          Canvas Size
        </span>
        <div className="flex border border-rule rounded-[2px] overflow-hidden font-mono text-xs">
          <button
            onClick={() => onChangeAspectRatio('4:5')}
            className={`px-3 py-1 transition-colors ${
              aspectRatio === '4:5' ? 'bg-ink text-bone font-medium' : 'bg-paper text-ink-soft hover:text-ink'
            }`}
          >
            4:5 (1080×1350)
          </button>
          <button
            onClick={() => onChangeAspectRatio('1:1')}
            className={`px-3 py-1 border-l border-rule transition-colors ${
              aspectRatio === '1:1' ? 'bg-ink text-bone font-medium' : 'bg-paper text-ink-soft hover:text-ink'
            }`}
          >
            1:1 (1080×1080)
          </button>
        </div>
      </div>
    </div>
  );
}

