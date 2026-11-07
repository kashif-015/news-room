import 'server-only';
import { ArticleWithCluster, Draft } from '@/lib/shared/types';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const CACHE_DIR = path.join(process.cwd(), '.data');
const CACHE_FILE = path.join(CACHE_DIR, 'local-store.json');

interface StoreData {
  articles: Record<string, ArticleWithCluster>;
  drafts: Record<string, Draft>;
}

declare global {
  // eslint-disable-next-line no-var
  var __NEWSROOM_STORE__: StoreData | undefined;
}

function loadStore(): StoreData {
  if (globalThis.__NEWSROOM_STORE__) {
    return globalThis.__NEWSROOM_STORE__;
  }

  try {
    if (fs.existsSync(CACHE_FILE)) {
      const content = fs.readFileSync(CACHE_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      globalThis.__NEWSROOM_STORE__ = {
        articles: parsed.articles || {},
        drafts: parsed.drafts || {},
      };
      return globalThis.__NEWSROOM_STORE__;
    }
  } catch (err) {
    console.warn('Failed to load local-store.json, initializing fresh store:', err);
  }

  globalThis.__NEWSROOM_STORE__ = { articles: {}, drafts: {} };
  return globalThis.__NEWSROOM_STORE__;
}

function saveStore(): void {
  try {
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }
    const store = loadStore();
    fs.writeFileSync(CACHE_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Failed to persist local-store.json:', err);
  }
}

export function saveInMemoryArticle(article: ArticleWithCluster): void {
  const store = loadStore();
  store.articles[article.id] = article;
  saveStore();
}

export function saveInMemoryArticles(articles: ArticleWithCluster[]): void {
  const store = loadStore();
  for (const art of articles) {
    store.articles[art.id] = art;
  }
  saveStore();
}

export function getInMemoryArticle(id: string): ArticleWithCluster | undefined {
  const store = loadStore();
  return store.articles[id];
}

export function getAllInMemoryArticles(): ArticleWithCluster[] {
  const store = loadStore();
  return Object.values(store.articles).sort(
    (a, b) => new Date(b.fetched_at).getTime() - new Date(a.fetched_at).getTime()
  );
}

export function saveInMemoryDraft(draftData: Partial<Draft>): Draft {
  const store = loadStore();
  const id = draftData.id || `draft-${crypto.randomBytes(6).toString('hex')}`;
  const now = new Date().toISOString();
  const draft: Draft = {
    id,
    article_id: draftData.article_id || null,
    headline: draftData.headline || 'Untitled Draft',
    headline_options: draftData.headline_options || [],
    caption: draftData.caption || '',
    hashtags: draftData.hashtags || [],
    fact_table: draftData.fact_table || [],
    template_id: draftData.template_id || 'template-a',
    design_config: draftData.design_config || null,
    status: draftData.status || 'draft',
    language: draftData.language === 'hinglish' ? 'hinglish' : 'en',
    source_url: draftData.source_url || '',
    source_outlet: draftData.source_outlet || null,
    outcome: draftData.outcome || null,
    posted_at: draftData.posted_at || null,
    created_at: draftData.created_at || now,
    updated_at: now,
  };
  store.drafts[id] = draft;
  saveStore();
  return draft;
}

export function getInMemoryDraft(id: string): Draft | undefined {
  const store = loadStore();
  return store.drafts[id];
}

export function getAllInMemoryDrafts(): Draft[] {
  const store = loadStore();
  return Object.values(store.drafts).sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );
}

export function deleteInMemoryDraft(id: string): boolean {
  const store = loadStore();
  if (store.drafts[id]) {
    delete store.drafts[id];
    saveStore();
    return true;
  }
  return false;
}
