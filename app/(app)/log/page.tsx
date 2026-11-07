'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Dateline } from '@/components/ui/dateline';
import { Draft } from '@/lib/shared/types';
import { HEADLINE_ANGLES } from '@/lib/shared/constants';

export default function PerformanceLogPage() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
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
    }
    load();
  }, []);

  const postedDrafts = drafts.filter((d) => d.status === 'posted');

  // Calculate angle distribution
  const angleStats = HEADLINE_ANGLES.map((angle) => {
    const count = drafts.filter((d) => {
      const match = d.headline_options?.find((h) => h.text === d.headline);
      return match ? match.angle === angle.id : false;
    }).length;
    return { ...angle, count };
  });

  const maxCount = Math.max(...angleStats.map((a) => a.count), 1);

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Folio Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-rule">
          <div>
            <span className="font-mono text-xs uppercase tracking-wider text-ink-mute block">
              Editorial Analytics & Outcomes
            </span>
            <h1 className="font-fraunces text-3xl font-semibold text-ink tracking-tight mt-1">
              Performance Log
            </h1>
          </div>
          <span className="font-mono text-xs text-ink-mute">
            {postedDrafts.length} Published Posts
          </span>
        </div>

        {/* Honest Chart: Headline Angle Distribution */}
        <div className="border border-rule rounded-[2px] bg-paper p-6">
          <h3 className="font-mono text-xs uppercase tracking-wider text-ink-mute mb-2">
            Angle Preference & Usage Distribution
          </h3>
          <p className="font-inter text-xs text-ink-soft mb-6">
            Track which headline formulas you choose most frequently for publication.
          </p>

          <div className="space-y-3">
            {angleStats.map((angle) => {
              const pct = Math.round((angle.count / maxCount) * 100);

              return (
                <div key={angle.id} className="space-y-1">
                  <div className="flex items-center justify-between font-mono text-xs">
                    <span className="font-medium text-ink">{angle.label}</span>
                    <span className="text-ink-mute">
                      {angle.count} {angle.count === 1 ? 'post' : 'posts'}
                    </span>
                  </div>
                  {/* SVG Bar */}
                  <div className="w-full bg-bone h-5 rounded-[2px] overflow-hidden border border-rule">
                    <div
                      style={{ width: `${Math.max(pct, 4)}%` }}
                      className="bg-orange h-full transition-all duration-300"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Published Posts Log */}
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-rule">
            <span className="font-mono text-xs uppercase tracking-wider text-ink-mute">
              Published Ledger ({postedDrafts.length})
            </span>
          </div>

          <div className="border border-rule rounded-[2px] bg-paper overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-rule bg-bone/40 font-mono text-[11px] uppercase tracking-wider text-ink-mute">
                  <th className="py-3 px-4">Headline</th>
                  <th className="py-3 px-4">Source Outlet</th>
                  <th className="py-3 px-4">Outcome</th>
                  <th className="py-3 px-4">Published Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule font-sans text-xs">
                {postedDrafts.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center font-mono text-xs text-ink-mute">
                      No posts marked as posted yet.
                    </td>
                  </tr>
                ) : (
                  postedDrafts.map((d) => (
                    <tr key={d.id} className="hover:bg-bone-deep/20 transition-colors">
                      <td className="py-3 px-4 font-fraunces text-base font-semibold text-ink">
                        {d.headline}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-ink-mute">
                        {d.source_outlet || 'Verified'}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs">
                        <span className="bg-bone px-2 py-0.5 rounded-[2px] border border-rule text-ink-soft">
                          {d.outcome ? d.outcome.replace(/_/g, ' ') : 'accepted'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-ink-mute">
                        <Dateline date={d.posted_at || d.updated_at} format="full" />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

