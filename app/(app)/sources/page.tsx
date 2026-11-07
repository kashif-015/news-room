'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusDot } from '@/components/ui/status-dot';
import { Dateline } from '@/components/ui/dateline';
import { Source } from '@/lib/shared/types';
import { CATEGORIES } from '@/lib/shared/constants';
import { Plus, Trash2, ExternalLink } from 'lucide-react';

export default function SourcesPage() {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Source Form
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState<string>('general');
  const [submitting, setSubmitting] = useState(false);
  const [addError, setAddError] = useState('');

  const fetchSources = async () => {
    try {
      const res = await fetch('/api/sources');
      if (res.ok) {
        const json = await res.json();
        setSources(json.data || []);
      }
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSources();
  }, []);

  const handleAddSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !url.trim()) return;

    setSubmitting(true);
    setAddError('');

    try {
      const res = await fetch('/api/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          type: 'rss',
          url: url.trim(),
          category,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to add source');
      }

      setSources((prev) => [json.data, ...prev]);
      setName('');
      setUrl('');
      setShowAddForm(false);
    } catch (err: unknown) {
      setAddError(err instanceof Error ? err.message : 'Invalid RSS URL');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      const res = await fetch('/api/sources', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, active: !currentActive }),
      });
      if (res.ok) {
        setSources((prev) =>
          prev.map((s) => (s.id === id ? { ...s, active: !currentActive } : s))
        );
      }
    } catch {
      alert('Failed to update source');
    }
  };

  const handleDeleteSource = async (id: string) => {
    if (!confirm('Remove this source from your feed collection?')) return;

    try {
      await fetch(`/api/sources?id=${id}`, { method: 'DELETE' });
      setSources((prev) => prev.filter((s) => s.id !== id));
    } catch {
      alert('Failed to remove source');
    }
  };

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Folio Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-rule">
          <div>
            <span className="font-mono text-xs uppercase tracking-wider text-ink-mute block">
              Wire Dispatch Manager
            </span>
            <h1 className="font-fraunces text-3xl font-semibold text-ink tracking-tight mt-1">
              News Sources & RSS Feeds
            </h1>
          </div>
          <Button
            variant="primary"
            size="small"
            onClick={() => setShowAddForm(!showAddForm)}
            leadingIcon={<Plus className="w-3.5 h-3.5" />}
          >
            {showAddForm ? 'Cancel' : 'Add Source'}
          </Button>
        </div>

        {/* Add Source Drawer */}
        {showAddForm && (
          <form
            onSubmit={handleAddSource}
            className="border border-rule rounded-[2px] bg-paper p-5 space-y-4 animate-in fade-in duration-150"
          >
            <h3 className="font-mono text-xs uppercase tracking-wider text-ink-mute pb-2 border-b border-rule">
              Add New RSS Feed
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="SOURCE / PUBLICATION NAME"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Economic Times"
                required
              />

              <div>
                <label className="block font-mono text-[10px] uppercase tracking-wider text-ink-mute mb-1">
                  CATEGORY
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-10 bg-paper border border-rule rounded-[2px] px-3 font-mono text-xs text-ink focus:outline-none focus:ring-1 focus:ring-orange"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <Input
              label="RSS FEED URL"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/rss/feed.xml"
              error={addError}
              required
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" size="small" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="small" loading={submitting}>
                Verify & Add Source
              </Button>
            </div>
          </form>
        )}

        {/* Sources Table / Ruled List */}
        <div className="border border-rule rounded-[2px] bg-paper overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-rule bg-bone/40 font-mono text-[11px] uppercase tracking-wider text-ink-mute">
                <th className="py-3 px-4">Publication / Source</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Status & Last Sync</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule font-sans text-xs">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center font-mono text-xs text-ink-mute">
                    Loading source registry...
                  </td>
                </tr>
              ) : sources.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center font-mono text-xs text-ink-mute">
                    No sources configured yet. Add your first RSS feed above.
                  </td>
                </tr>
              ) : (
                sources.map((src) => {
                  const status = src.last_error
                    ? 'alert'
                    : src.active
                    ? 'pine'
                    : 'orange';

                  return (
                    <tr key={src.id} className="hover:bg-bone-deep/20 transition-colors">
                      {/* Name & Link */}
                      <td className="py-3 px-4 font-fraunces text-base font-semibold text-ink">
                        <div className="flex items-center gap-2">
                          <StatusDot status={status} />
                          <span>{src.name}</span>
                          {src.url && (
                            <a
                              href={src.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-ink-mute hover:text-orange"
                              title="Open Feed Link"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                        {src.last_error && (
                          <span className="font-mono text-[10px] text-alert block mt-1">
                            {src.last_error}
                          </span>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4 font-mono text-xs text-ink-mute uppercase tracking-wider">
                        {src.category || 'general'}
                      </td>

                      {/* Last Fetched */}
                      <td className="py-3 px-4 font-mono text-xs text-ink-mute">
                        {src.last_fetched_at ? (
                          <Dateline date={src.last_fetched_at} format="relative" />
                        ) : (
                          'Not yet synced'
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggleActive(src.id, src.active)}
                            className={`font-mono text-[11px] px-2 py-0.5 rounded-[2px] border transition-colors ${
                              src.active
                                ? 'bg-bone text-ink-soft border-rule hover:border-ink'
                                : 'bg-bone-deep text-ink-mute border-rule'
                            }`}
                          >
                            {src.active ? 'Active' : 'Paused'}
                          </button>
                          <button
                            onClick={() => handleDeleteSource(src.id)}
                            className="p-1 text-ink-mute hover:text-alert transition-colors"
                            title="Remove Source"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}

