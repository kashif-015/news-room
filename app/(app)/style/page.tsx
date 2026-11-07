'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StyleExample } from '@/lib/shared/types';
import { Trash2, Plus, Check } from 'lucide-react';

export default function StyleLibraryPage() {
  const [examples, setExamples] = useState<StyleExample[]>([]);
  const [loading, setLoading] = useState(true);

  // New Example form
  const [showAddForm, setShowAddForm] = useState(false);
  const [kind, setKind] = useState<'headline' | 'caption'>('headline');
  const [language, setLanguage] = useState<'en' | 'hinglish'>('en');
  const [body, setBody] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchExamples = async () => {
    try {
      const res = await fetch('/api/style-examples');
      if (res.ok) {
        const json = await res.json();
        setExamples(json.data || []);
      }
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExamples();
  }, []);

  const handleAddExample = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;

    setSaving(true);
    try {
      const res = await fetch('/api/style-examples', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind,
          language,
          body: body.trim(),
          note: note.trim() || undefined,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        setExamples((prev) => [json.data, ...prev]);
        setBody('');
        setNote('');
        setShowAddForm(false);
      }
    } catch {
      alert('Failed to save style example');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this style example? This will remove it from the voice model prompts.')) return;

    try {
      await fetch(`/api/style-examples?id=${id}`, { method: 'DELETE' });
      setExamples((prev) => prev.filter((ex) => ex.id !== id));
    } catch {
      alert('Failed to delete example');
    }
  };

  const headlineExamples = examples.filter((ex) => ex.kind === 'headline');
  const captionExamples = examples.filter((ex) => ex.kind === 'caption');

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Folio Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-rule">
          <div>
            <span className="font-mono text-xs uppercase tracking-wider text-ink-mute block">
              Voice Model Memory
            </span>
            <h1 className="font-fraunces text-3xl font-semibold text-ink tracking-tight mt-1">
              Style Library
            </h1>
          </div>
          <Button
            variant="primary"
            size="small"
            onClick={() => setShowAddForm(!showAddForm)}
            leadingIcon={<Plus className="w-3.5 h-3.5" />}
          >
            {showAddForm ? 'Cancel' : 'Add Example'}
          </Button>
        </div>

        <p className="font-inter text-sm text-ink-soft max-w-2xl leading-relaxed">
          Paste your best-performing past headlines and captions here. The AI generator samples from this collection in every generation prompt to match your natural rhythm, tone, and word choice.
        </p>

        {/* Add Example Form Drawer */}
        {showAddForm && (
          <form
            onSubmit={handleAddExample}
            className="border border-rule rounded-[2px] bg-paper p-5 space-y-4 animate-in fade-in duration-150"
          >
            <h3 className="font-mono text-xs uppercase tracking-wider text-ink-mute pb-2 border-b border-rule">
              New Style Example
            </h3>

            <div className="flex gap-4 flex-wrap">
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-wider text-ink-mute mb-1">
                  Format
                </label>
                <div className="flex border border-rule rounded-[2px] overflow-hidden font-mono text-xs">
                  <button
                    type="button"
                    onClick={() => setKind('headline')}
                    className={`px-3 py-1 ${kind === 'headline' ? 'bg-ink text-bone font-medium' : 'bg-bone text-ink-soft'}`}
                  >
                    Headline
                  </button>
                  <button
                    type="button"
                    onClick={() => setKind('caption')}
                    className={`px-3 py-1 border-l border-rule ${kind === 'caption' ? 'bg-ink text-bone font-medium' : 'bg-bone text-ink-soft'}`}
                  >
                    Caption
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase tracking-wider text-ink-mute mb-1">
                  Language
                </label>
                <div className="flex border border-rule rounded-[2px] overflow-hidden font-mono text-xs">
                  <button
                    type="button"
                    onClick={() => setLanguage('en')}
                    className={`px-3 py-1 ${language === 'en' ? 'bg-ink text-bone font-medium' : 'bg-bone text-ink-soft'}`}
                  >
                    English
                  </button>
                  <button
                    type="button"
                    onClick={() => setLanguage('hinglish')}
                    className={`px-3 py-1 border-l border-rule ${language === 'hinglish' ? 'bg-ink text-bone font-medium' : 'bg-bone text-ink-soft'}`}
                  >
                    Hinglish
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block font-mono text-[10px] uppercase tracking-wider text-ink-mute mb-1">
                Body Copy (Paste high-performing text)
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={kind === 'headline' ? 2 : 5}
                required
                placeholder={
                  kind === 'headline'
                    ? 'e.g. UPI transactions hit record ₹20 lakh crore in March alone'
                    : 'Paste an editorial caption that performed exceptionally well...'
                }
                className="w-full bg-bone border border-rule rounded-[2px] p-3 font-sans text-sm text-ink focus:outline-none focus:ring-1 focus:ring-orange"
              />
            </div>

            <Input
              label="EDITORIAL NOTE / ANGLE (OPTIONAL)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. High save count, lead with big number"
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" size="small" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="small" loading={saving}>
                Save to Library
              </Button>
            </div>
          </form>
        )}

        {/* Two-Column Ruled Lists (Headlines & Captions) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* Column 1: Headlines */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-rule">
              <span className="font-mono text-xs uppercase tracking-wider text-ink-mute">
                Headline Examples ({headlineExamples.length})
              </span>
            </div>

            {headlineExamples.length === 0 ? (
              <p className="font-inter text-xs text-ink-mute py-4">No headline examples added yet.</p>
            ) : (
              <ul className="divide-y divide-rule border-y border-rule bg-paper">
                {headlineExamples.map((ex) => (
                  <li key={ex.id} className="p-3.5 space-y-1 group">
                    <div className="flex items-center justify-between font-mono text-[10px] text-ink-mute">
                      <span className="text-orange uppercase tracking-wider">
                        {ex.language}
                      </span>
                      <button
                        onClick={() => handleDelete(ex.id)}
                        className="opacity-0 group-hover:opacity-100 text-ink-mute hover:text-alert transition-opacity"
                        title="Delete example"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="font-fraunces text-base font-semibold text-ink leading-snug">
                      "{ex.body}"
                    </p>
                    {ex.note && (
                      <span className="font-mono text-[11px] text-ink-mute block">
                        Note: {ex.note}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Column 2: Captions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-rule">
              <span className="font-mono text-xs uppercase tracking-wider text-ink-mute">
                Caption Examples ({captionExamples.length})
              </span>
            </div>

            {captionExamples.length === 0 ? (
              <p className="font-inter text-xs text-ink-mute py-4">No caption examples added yet.</p>
            ) : (
              <ul className="divide-y divide-rule border-y border-rule bg-paper">
                {captionExamples.map((ex) => (
                  <li key={ex.id} className="p-4 space-y-2 group">
                    <div className="flex items-center justify-between font-mono text-[10px] text-ink-mute">
                      <span className="text-orange uppercase tracking-wider">
                        {ex.language}
                      </span>
                      <button
                        onClick={() => handleDelete(ex.id)}
                        className="opacity-0 group-hover:opacity-100 text-ink-mute hover:text-alert transition-opacity"
                        title="Delete example"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="font-inter text-sm text-ink-soft leading-relaxed">
                      {ex.body}
                    </p>
                    {ex.note && (
                      <span className="font-mono text-[11px] text-ink-mute block">
                        Note: {ex.note}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

