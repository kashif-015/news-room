'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface NotesStripProps {
  articleId: string;
}

export function NotesStrip({ articleId }: NotesStripProps) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(`newsdesk_notes_${articleId}`) || '';
    }
    return '';
  });

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setNotes(val);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`newsdesk_notes_${articleId}`, val);
    }
  };

  return (
    <div className="border border-rule rounded-[2px] bg-paper overflow-hidden mt-6">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-4 py-2.5 flex items-center justify-between font-mono text-xs uppercase tracking-wider text-ink-mute hover:text-ink hover:bg-bone transition-colors"
      >
        <span>Desk Notes (Private Scratchpad)</span>
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {open && (
        <div className="p-4 border-t border-rule bg-bone/30">
          <textarea
            value={notes}
            onChange={handleChange}
            placeholder="Jot down preliminary thoughts, angle ideas, or context for this story..."
            rows={3}
            className="w-full bg-paper border border-rule rounded-[2px] p-2.5 font-sans text-sm text-ink placeholder:text-ink-mute focus:outline-none focus:ring-1 focus:ring-orange"
          />
        </div>
      )}
    </div>
  );
}

