'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { Dateline } from '@/components/ui/dateline';
import { Draft } from '@/lib/shared/types';
import { Check, Trash2 } from 'lucide-react';

export default function DraftsListPage() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDrafts = async () => {
    try {
      const res = await fetch('/api/drafts');
      if (res.ok) {
        const json = await res.json();
        setDrafts(json.data || []);
      }
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrafts();
  }, []);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Delete this draft? This can’t be undone.')) return;

    try {
      await fetch(`/api/drafts/${id}`, { method: 'DELETE' });
      setDrafts((prev) => prev.filter((d) => d.id !== id));
    } catch {
      alert('Failed to delete draft');
    }
  };

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto">
        {/* Folio Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-rule mb-6">
          <div>
            <span className="font-mono text-xs uppercase tracking-wider text-ink-mute block">
              Editorial Archive
            </span>
            <h1 className="font-fraunces text-3xl font-semibold text-ink tracking-tight mt-1">
              Drafts & Published Posts
            </h1>
          </div>
          <span className="font-mono text-xs text-ink-mute">
            {drafts.length} {drafts.length === 1 ? 'item' : 'items'}
          </span>
        </div>

        {/* Loading */}
        {loading && (
          <div className="py-12 text-center font-mono text-xs text-ink-mute">
            Reading drafts ledger...
          </div>
        )}

        {/* Empty */}
        {!loading && drafts.length === 0 && (
          <div className="border border-rule p-8 text-center bg-paper rounded-[2px] my-6">
            <p className="font-fraunces text-xl font-semibold text-ink mb-2">
              No drafts created yet
            </p>
            <p className="font-inter text-sm text-ink-soft max-w-md mx-auto mb-4">
              Select any story on the news feed and click "Create post" to start drafting headlines and verifying claims.
            </p>
            <Link
              href="/"
              className="inline-block bg-orange text-paper font-mono text-xs px-4 py-2 rounded-[2px] hover:bg-orange-deep transition-colors"
            >
              Browse News Feed
            </Link>
          </div>
        )}

        {/* Ruled List of Drafts */}
        {!loading && drafts.length > 0 && (
          <ul className="divide-y divide-rule border-y border-rule bg-paper">
            {drafts.map((d) => {
              const isPosted = d.status === 'posted';

              return (
                <li key={d.id} className="group relative transition-colors hover:bg-bone-deep/40">
                  <Link href={`/drafts/${d.id}`} className="block p-4 sm:p-5">
                    <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
                      <Dateline source={d.source_outlet} date={d.updated_at} format="relative" />

                      <div className="flex items-center gap-2">
                        {/* Status Tag */}
                        <span
                          className={`inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-[2px] ${
                            isPosted
                              ? 'bg-pine text-paper font-medium'
                              : 'bg-bone text-ink-mute border border-rule'
                          }`}
                        >
                          {isPosted && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          <span>{isPosted ? 'Posted' : 'Draft'}</span>
                        </span>

                        {/* Outcome Tag */}
                        {d.outcome && (
                          <span className="font-mono text-[10px] text-ink-soft bg-bone-deep/50 px-1.5 py-0.5 rounded-[2px]">
                            {d.outcome.replace(/_/g, ' ')}
                          </span>
                        )}

                        {/* Delete button */}
                        <button
                          onClick={(e) => handleDelete(e, d.id)}
                          className="text-ink-mute hover:text-alert p-1 transition-colors"
                          title="Delete draft"
                          aria-label="Delete draft"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <h2 className="font-fraunces text-xl font-semibold text-ink group-hover:text-orange transition-colors leading-snug">
                      {d.headline || 'Untitled Draft'}
                    </h2>

                    {d.caption && (
                      <p className="font-inter text-sm text-ink-soft line-clamp-2 mt-1 leading-relaxed">
                        {d.caption}
                      </p>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </AppShell>
  );
}

