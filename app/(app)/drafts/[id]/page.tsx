'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { HeadlineList } from '@/components/draft/headline-list';
import { CaptionEditor } from '@/components/draft/caption-editor';
import { FactTable } from '@/components/draft/fact-table';
import { BackgroundPicker } from '@/components/draft/background-picker';
import { TemplateSwitcher } from '@/components/designer/template-switcher';
import { PostPreview, PostDesignConfig } from '@/components/designer/post-preview';
import { ExportButton } from '@/components/designer/export-button';
import { Button } from '@/components/ui/button';
import { Draft, HeadlineOption } from '@/lib/shared/types';
import { ArrowLeft, ExternalLink, Check } from 'lucide-react';

export default function DraftEditorPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [draft, setDraft] = useState<Draft | null>(null);
  const [headline, setHeadline] = useState('');
  const [headlineOptions, setHeadlineOptions] = useState<HeadlineOption[]>([]);
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [designConfig, setDesignConfig] = useState<PostDesignConfig>({
    templateId: 'template-a',
    aspectRatio: '4:5',
    imageUrl: null,
    highlightPhrase: '',
    theme: 'light',
  });
  const [status, setStatus] = useState<'draft' | 'posted'>('draft');
  const [outcome, setOutcome] = useState<'used_as_is' | 'edited' | 'discarded' | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string>('all changes saved');

  const exportRef = useRef<HTMLDivElement>(null);

  // Load draft
  useEffect(() => {
    async function loadDraft() {
      try {
        const res = await fetch(`/api/drafts/${id}`);
        if (!res.ok) throw new Error('Draft not found');
        const data = await res.json();
        const d: Draft = data.data;

        setDraft(d);
        setHeadline(d.headline || '');
        setHeadlineOptions(d.headline_options || []);
        setCaption(d.caption || '');
        setHashtags(d.hashtags || []);
        setStatus(d.status || 'draft');
        setOutcome(d.outcome || null);

        if (d.design_config) {
          setDesignConfig((prev) => ({ ...prev, ...d.design_config }));
        }
        if (d.template_id) {
          setDesignConfig((prev) => ({ ...prev, templateId: d.template_id as PostDesignConfig['templateId'] }));
        }
      } catch {
        // Handle error
      }
    }
    if (id) loadDraft();
  }, [id]);

  // Debounced Autosave
  const saveDraft = useCallback(
    async (updates: Partial<Draft>) => {
      setIsSaving(true);
      try {
        await fetch(`/api/drafts/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });
        setLastSaved(`saved ${new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`);
      } catch {
        setLastSaved('autosave failed');
      } finally {
        setIsSaving(false);
      }
    },
    [id]
  );

  const handleHeadlineSelect = (selectedText: string) => {
    setHeadline(selectedText);
    saveDraft({ headline: selectedText });
  };

  const handleHeadlineOptionUpdate = (index: number, newText: string) => {
    const updated = [...headlineOptions];
    updated[index] = { ...updated[index], text: newText };
    setHeadlineOptions(updated);
    saveDraft({ headline_options: updated });
  };

  const handleCaptionChange = (newCaption: string) => {
    setCaption(newCaption);
    saveDraft({ caption: newCaption });
  };

  const handleToggleStatus = () => {
    const nextStatus = status === 'draft' ? 'posted' : 'draft';
    setStatus(nextStatus);
    saveDraft({ status: nextStatus });
  };

  const handleOutcomeChange = (newOutcome: 'used_as_is' | 'edited' | 'discarded') => {
    setOutcome(newOutcome);
    saveDraft({ outcome: newOutcome });
  };

  if (!draft) {
    return (
      <AppShell>
        <div className="py-12 text-center font-mono text-xs text-ink-mute">
          Loading editorial workspace...
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      {/* Top Folio Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-rule mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/drafts"
            className="inline-flex items-center gap-1.5 font-mono text-xs text-ink-mute hover:text-ink transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>All Drafts</span>
          </Link>
          <span className="text-rule">·</span>
          <span className="font-mono text-xs text-ink-mute">
            {isSaving ? 'Autosaving...' : lastSaved}
          </span>
        </div>

        {/* Status Toggle & Outcome */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Outcome tracking */}
          <div className="flex items-center gap-1 border border-rule rounded-[2px] p-0.5 bg-paper font-mono text-[11px]">
            <span className="text-ink-mute px-2">Angle outcome:</span>
            <button
              onClick={() => handleOutcomeChange('used_as_is')}
              className={`px-2 py-0.5 rounded-[1px] transition-colors ${
                outcome === 'used_as_is' ? 'bg-pine text-paper font-medium' : 'text-ink-soft hover:text-ink'
              }`}
            >
              Used as is
            </button>
            <button
              onClick={() => handleOutcomeChange('edited')}
              className={`px-2 py-0.5 rounded-[1px] transition-colors ${
                outcome === 'edited' ? 'bg-orange text-paper font-medium' : 'text-ink-soft hover:text-ink'
              }`}
            >
              Edited
            </button>
            <button
              onClick={() => handleOutcomeChange('discarded')}
              className={`px-2 py-0.5 rounded-[1px] transition-colors ${
                outcome === 'discarded' ? 'bg-alert text-paper font-medium' : 'text-ink-soft hover:text-ink'
              }`}
            >
              Discarded
            </button>
          </div>

          {/* Status Button */}
          <button
            onClick={handleToggleStatus}
            className={`font-mono text-xs px-3 py-1.5 rounded-[2px] border transition-colors flex items-center gap-1.5 ${
              status === 'posted'
                ? 'bg-pine text-paper border-pine'
                : 'border-rule bg-paper text-ink-soft hover:border-ink'
            }`}
          >
            {status === 'posted' && <Check className="w-3 h-3 stroke-[2.5]" />}
            <span>{status === 'posted' ? 'Posted to Instagram' : 'Mark as Posted'}</span>
          </button>
        </div>
      </div>

      {/* Editor & Designer Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (Editorial Writing & Verification) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Headline Options */}
          {headlineOptions.length > 0 && (
            <HeadlineList
              options={headlineOptions}
              selectedHeadline={headline}
              onSelect={handleHeadlineSelect}
              onUpdateOption={handleHeadlineOptionUpdate}
            />
          )}

          {/* Caption Editor */}
          <CaptionEditor
            caption={caption}
            hashtags={hashtags}
            onChangeCaption={handleCaptionChange}
          />

          {/* Fact Verification Table */}
          <FactTable facts={draft.fact_table || []} />

          {/* Mandatory Source Credit Line */}
          <div className="border border-rule rounded-[2px] bg-paper p-4 font-mono text-xs flex items-center justify-between flex-wrap gap-2">
            <div>
              <span className="text-ink-mute uppercase tracking-wider block mb-1">
                Permanent Source Attribution
              </span>
              <span className="text-ink font-semibold">
                {draft.source_outlet || 'Official Report'}
              </span>
            </div>
            <a
              href={draft.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-orange hover:underline"
            >
              <span>{draft.source_url.slice(0, 40)}...</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Right Column (Designer & Live Preview) */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-16">
          {/* Live Preview */}
          <PostPreview
            headline={headline}
            sourceOutlet={draft.source_outlet}
            config={designConfig}
            exportRef={exportRef}
          />

          {/* Download Action */}
          <ExportButton targetRef={exportRef} headline={headline} />

          {/* Template Switcher */}
          <div className="border border-rule rounded-[2px] bg-paper p-4">
            <TemplateSwitcher
              activeTemplateId={designConfig.templateId}
              onChangeTemplate={(newTmpl) => {
                const next = { ...designConfig, templateId: newTmpl };
                setDesignConfig(next);
                saveDraft({ template_id: newTmpl, design_config: next as unknown as Record<string, unknown> });
              }}
              aspectRatio={designConfig.aspectRatio}
              onChangeAspectRatio={(ratio) => {
                const next = { ...designConfig, aspectRatio: ratio };
                setDesignConfig(next);
                saveDraft({ design_config: next as unknown as Record<string, unknown> });
              }}
            />
          </div>

          {/* Background Picker */}
          <div className="border border-rule rounded-[2px] bg-paper p-4">
            <BackgroundPicker
              currentImageUrl={designConfig.imageUrl}
              onSelectImage={(newUrl) => {
                const next = { ...designConfig, imageUrl: newUrl };
                setDesignConfig(next);
                saveDraft({ design_config: next as unknown as Record<string, unknown> });
              }}
            />
          </div>
        </div>
      </div>
    </AppShell>
  );
}

