'use client';

import React, { useState } from 'react';
import { HeadlineOption } from '@/lib/shared/types';
import { Check } from 'lucide-react';

interface HeadlineListProps {
  options: HeadlineOption[];
  selectedHeadline: string;
  onSelect: (headline: string) => void;
  onUpdateOption?: (index: number, newText: string) => void;
}

export function HeadlineList({
  options,
  selectedHeadline,
  onSelect,
  onUpdateOption,
}: HeadlineListProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editText, setEditText] = useState('');

  const handleDoubleClick = (index: number, text: string) => {
    setEditingIndex(index);
    setEditText(text);
  };

  const handleSaveEdit = (index: number) => {
    if (onUpdateOption && editText.trim()) {
      onUpdateOption(index, editText.trim());
      if (options[index].text === selectedHeadline) {
        onSelect(editText.trim());
      }
    }
    setEditingIndex(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-rule">
        <span className="font-mono text-xs uppercase tracking-wider text-ink-mute">
          Headline Angles (Click to select, double-click to edit)
        </span>
      </div>

      <ul className="divide-y divide-rule border-y border-rule bg-paper">
        {options.map((opt, i) => {
          const isSelected = selectedHeadline === opt.text;
          const isEditing = editingIndex === i;

          return (
            <li
              key={i}
              onClick={() => !isEditing && onSelect(opt.text)}
              onDoubleClick={() => handleDoubleClick(i, opt.text)}
              className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors ${
                isSelected ? 'bg-bone-deep/60' : 'hover:bg-bone-deep/30'
              }`}
            >
              {/* Radio check */}
              <span
                className={`w-4 h-4 rounded-full mt-0.5 border flex items-center justify-center shrink-0 ${
                  isSelected ? 'border-orange bg-orange text-paper' : 'border-rule'
                }`}
              >
                {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
              </span>

              <div className="flex-1 min-w-0">
                <span className="inline-block font-mono text-[10px] uppercase tracking-wider font-semibold text-orange mb-1">
                  [{opt.angle}]
                </span>

                {isEditing ? (
                  <input
                    type="text"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onBlur={() => handleSaveEdit(i)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(i)}
                    autoFocus
                    className="w-full font-fraunces text-base font-semibold text-ink bg-bone p-1 border border-orange rounded-[2px]"
                  />
                ) : (
                  <p className="font-fraunces text-base font-semibold text-ink leading-snug">
                    {opt.text}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

