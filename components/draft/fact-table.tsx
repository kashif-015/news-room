'use client';

import React from 'react';
import { FactEntry } from '@/lib/shared/types';
import { Check, AlertCircle } from 'lucide-react';

interface FactTableProps {
  facts: FactEntry[];
}

export function FactTable({ facts }: FactTableProps) {
  if (!facts || facts.length === 0) {
    return (
      <div className="border border-rule p-4 bg-paper rounded-[2px] font-mono text-xs text-ink-mute">
        No verification facts attached to this draft.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-rule">
        <span className="font-mono text-xs uppercase tracking-wider text-ink-mute">
          Fact Verification Table (Every claim mapped to source)
        </span>
      </div>

      <div className="border border-rule rounded-[2px] bg-paper overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-rule bg-bone/40 font-mono text-[11px] uppercase tracking-wider text-ink-mute">
              <th className="py-2.5 px-3 w-1/2">What the caption says</th>
              <th className="py-2.5 px-3 w-1/2 border-l border-rule">Where the article says it</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rule font-sans text-xs">
            {facts.map((fact, index) => {
              const isSupported = Boolean(fact.source_sentence && fact.source_sentence.trim().length > 10);

              return (
                <tr
                  key={index}
                  className={`transition-colors ${
                    isSupported ? 'hover:bg-bone-deep/20' : 'bg-alert-wash/30 border-l-2 border-alert'
                  }`}
                >
                  {/* Claim */}
                  <td className="p-3 align-top">
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5 shrink-0">
                        {isSupported ? (
                          <Check className="w-3.5 h-3.5 text-pine stroke-[2.5]" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5 text-alert stroke-[2.5]" />
                        )}
                      </span>
                      <span className="text-ink font-medium leading-relaxed">{fact.claim}</span>
                    </div>
                  </td>

                  {/* Supporting Sentence */}
                  <td className="p-3 align-top border-l border-rule">
                    {isSupported ? (
                      <blockquote className="font-fraunces italic text-ink-soft leading-relaxed">
                        "{fact.source_sentence}"
                      </blockquote>
                    ) : (
                      <span className="font-mono text-[11px] text-alert font-medium">
                        No source sentence found. Cut it or verify the article.
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

