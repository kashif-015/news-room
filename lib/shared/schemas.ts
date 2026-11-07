// Zod validation schemas matching all shared types.
// Used for validating API inputs and AI outputs.

import { z } from 'zod';

// ============================================================================
// Enums and primitives
// ============================================================================

export const sourceTypeSchema = z.enum(['rss', 'gnews', 'newsdata']);
export const categorySchema = z.enum([
  'general', 'politics', 'tech', 'business', 'sports', 'world', 'entertainment',
]);
export const languageSchema = z.enum(['en', 'hinglish']);
export const timeRangeSchema = z.enum(['3h', '12h', '24h', '3d']);
export const sortSchema = z.enum(['trend', 'newest']);
export const styleKindSchema = z.enum(['headline', 'caption']);
export const addedBySchema = z.enum(['auto', 'manual']);
export const draftStatusSchema = z.enum(['draft', 'posted']);
export const outcomeSchema = z.enum(['used_as_is', 'edited', 'discarded']);
export const headlineAngleSchema = z.enum(['blunt', 'question', 'number', 'hinglish', 'short']);

// ============================================================================
// Database record schemas
// ============================================================================

export const sourceSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  type: sourceTypeSchema,
  url: z.string().url().nullable(),
  category: z.string().nullable(),
  active: z.boolean(),
  last_fetched_at: z.string().nullable(),
  last_error: z.string().nullable(),
  created_at: z.string(),
});

export const clusterSchema = z.object({
  id: z.string().uuid(),
  headline: z.string().min(1),
  outlet_count: z.number().int().min(1),
  trend_score: z.number(),
  first_seen: z.string(),
  last_seen: z.string(),
});

export const articleSchema = z.object({
  id: z.string().min(1),
  source_id: z.string().nullable(),
  cluster_id: z.string().nullable(),
  title: z.string().min(1),
  title_norm: z.string().min(1),
  url: z.string().url(),
  outlet: z.string().nullable(),
  summary: z.string().nullable(),
  image_url: z.string().url().nullable(),
  category: z.string().nullable(),
  published_at: z.string().nullable(),
  fetched_at: z.string(),
  used: z.boolean(),
});

export const articleTextSchema = z.object({
  article_id: z.string().min(1),
  text_content: z.string().min(1),
  fetched_at: z.string(),
});

export const tweetSchema = z.object({
  id: z.string().min(1),
  article_id: z.string().nullable(),
  cluster_id: z.string().nullable(),
  tweet_url: z.string().url(),
  author_handle: z.string().nullable(),
  author_name: z.string().nullable(),
  embed_html: z.string().nullable(),
  added_by: addedBySchema,
  created_at: z.string(),
});

export const styleExampleSchema = z.object({
  id: z.string().min(1),
  kind: styleKindSchema,
  language: languageSchema,
  body: z.string().min(1),
  note: z.string().nullable(),
  created_at: z.string(),
});

export const headlineOptionSchema = z.object({
  angle: headlineAngleSchema,
  text: z.string().min(1),
});

export const factEntrySchema = z.object({
  claim: z.string().min(1),
  source_sentence: z.string().min(1),
  supported: z.boolean().optional(),
});

export const draftSchema = z.object({
  id: z.string().min(1),
  article_id: z.string().nullable(),
  headline_options: z.array(headlineOptionSchema).nullable(),
  headline: z.string().nullable(),
  caption: z.string().nullable(),
  hashtags: z.array(z.string()).nullable(),
  fact_table: z.array(factEntrySchema).nullable(),
  language: languageSchema,
  template_id: z.string().nullable(),
  design_config: z.record(z.string(), z.unknown()).nullable(),
  source_url: z.string().url(),
  source_outlet: z.string().nullable(),
  outcome: outcomeSchema.nullable(),
  status: draftStatusSchema,
  posted_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const postLogSchema = z.object({
  draft_id: z.string().uuid(),
  likes: z.number().int().nullable(),
  comments: z.number().int().nullable(),
  saves: z.number().int().nullable(),
  shares: z.number().int().nullable(),
  reach: z.number().int().nullable(),
  logged_at: z.string(),
});

export const generationCacheSchema = z.object({
  cache_key: z.string().min(1),
  output: z.record(z.string(), z.unknown()),
  provider: z.string().nullable(),
  created_at: z.string(),
});

export const apiUsageSchema = z.object({
  day: z.string(),
  provider: z.string().min(1),
  count: z.number().int().min(0),
});

export const loginAttemptSchema = z.object({
  ip: z.string().min(1),
  attempted_at: z.string(),
});

// ============================================================================
// API request schemas
// ============================================================================

export const addSourceRequestSchema = z.object({
  name: z.string().min(1).max(200),
  type: sourceTypeSchema,
  url: z.string().url(),
  category: categorySchema,
});

export const updateSourceRequestSchema = z.object({
  active: z.boolean().optional(),
  name: z.string().min(1).max(200).optional(),
  category: categorySchema.optional(),
});

export const feedFiltersSchema = z.object({
  category: categorySchema.optional(),
  source_id: z.string().uuid().optional(),
  time_range: timeRangeSchema.optional(),
  used: z.boolean().optional(),
  sort: sortSchema.optional(),
  cursor: z.string().uuid().optional(),
  limit: z.number().int().min(1).max(100).optional(),
});

export const generateRequestSchema = z.object({
  articleId: z.string().min(1),
  language: languageSchema,
  mode: z.enum(['full', 'regenerate_headlines', 'shorter', 'sharper', 'more_context']),
});

export const saveTweetRequestSchema = z.object({
  url: z.string().url().refine(
    (url) => /^https?:\/\/(twitter|x)\.com\/[A-Za-z0-9_]+\/status\/\d+/.test(url),
    { message: 'Must be a valid X/Twitter status URL' }
  ),
  article_id: z.string().optional(),
  cluster_id: z.string().optional(),
});

export const saveDraftRequestSchema = z.object({
  article_id: z.string().min(1),
  headline_options: z.array(headlineOptionSchema).optional(),
  headline: z.string().optional(),
  caption: z.string().optional(),
  hashtags: z.array(z.string()).optional(),
  fact_table: z.array(factEntrySchema).optional(),
  language: languageSchema.optional(),
  template_id: z.string().optional(),
  design_config: z.record(z.string(), z.unknown()).optional(),
  source_url: z.string().min(1),
  source_outlet: z.string().optional(),
});

export const updateDraftRequestSchema = z.object({
  headline: z.string().optional(),
  caption: z.string().optional(),
  hashtags: z.array(z.string()).optional(),
  template_id: z.string().optional(),
  design_config: z.record(z.string(), z.unknown()).optional(),
  outcome: outcomeSchema.optional(),
  status: draftStatusSchema.optional(),
});

export const addStyleExampleRequestSchema = z.object({
  kind: styleKindSchema,
  language: languageSchema,
  body: z.string().min(1).max(2000),
  note: z.string().max(500).optional(),
});

export const mediaSearchRequestSchema = z.object({
  query: z.string().min(1).max(200),
  page: z.number().int().min(1).optional(),
});

// ============================================================================
// AI output validation schema
// ============================================================================

export const generationOutputSchema = z.object({
  headlines: z.array(headlineOptionSchema).min(5).max(5),
  caption: z.string().min(60).max(600),
  hashtags: z.array(z.string()).min(8).max(12),
  facts: z.array(factEntrySchema).min(1),
  thin_source_warning: z.string(),
});
