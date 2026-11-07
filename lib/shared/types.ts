// Shared TypeScript interfaces for all database tables and API request/response types.
// No secrets or server-only imports here.

// ============================================================================
// Database table types
// ============================================================================

export interface Source {
  id: string;
  name: string;
  type: 'rss' | 'gnews' | 'newsdata';
  url: string | null;
  category: string | null;
  active: boolean;
  last_fetched_at: string | null;
  last_error: string | null;
  created_at: string;
}

export interface Cluster {
  id: string;
  headline: string;
  outlet_count: number;
  trend_score: number;
  first_seen: string;
  last_seen: string;
}

export interface Article {
  id: string;
  source_id: string | null;
  cluster_id: string | null;
  title: string;
  title_norm: string;
  url: string;
  outlet: string | null;
  summary: string | null;
  image_url: string | null;
  category: string | null;
  published_at: string | null;
  fetched_at: string;
  used: boolean;
}

export interface ArticleText {
  article_id: string;
  text_content: string;
  fetched_at: string;
}

export interface Tweet {
  id: string;
  article_id: string | null;
  cluster_id: string | null;
  tweet_url: string;
  author_handle: string | null;
  author_name: string | null;
  embed_html: string | null;
  added_by: 'auto' | 'manual';
  created_at: string;
}

export interface StyleExample {
  id: string;
  kind: 'headline' | 'caption';
  language: 'en' | 'hinglish';
  body: string;
  note: string | null;
  created_at: string;
}

export interface HeadlineOption {
  angle: 'blunt' | 'question' | 'number' | 'hinglish' | 'short';
  text: string;
}

export interface FactEntry {
  claim: string;
  source_sentence: string;
  supported?: boolean;
}

export interface Draft {
  id: string;
  article_id: string | null;
  headline_options: HeadlineOption[] | null;
  headline: string | null;
  caption: string | null;
  hashtags: string[] | null;
  fact_table: FactEntry[] | null;
  language: 'en' | 'hinglish';
  template_id: string | null;
  design_config: Record<string, unknown> | null;
  source_url: string;
  source_outlet: string | null;
  outcome: 'used_as_is' | 'edited' | 'discarded' | null;
  status: 'draft' | 'posted';
  posted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PostLog {
  draft_id: string;
  likes: number | null;
  comments: number | null;
  saves: number | null;
  shares: number | null;
  reach: number | null;
  logged_at: string;
}

export interface GenerationCache {
  cache_key: string;
  output: Record<string, unknown>;
  provider: string | null;
  created_at: string;
}

export interface ApiUsage {
  day: string;
  provider: string;
  count: number;
}

export interface LoginAttempt {
  ip: string;
  attempted_at: string;
}

// ============================================================================
// Article with joined data (for feed display)
// ============================================================================

export interface ArticleWithCluster extends Article {
  cluster?: Cluster | null;
  source?: Pick<Source, 'name' | 'type'> | null;
}

// ============================================================================
// API Request types
// ============================================================================

export interface AddSourceRequest {
  name: string;
  type: 'rss' | 'gnews' | 'newsdata';
  url: string;
  category: string;
}

export interface UpdateSourceRequest {
  active?: boolean;
  name?: string;
  category?: string;
}

export interface FeedFilters {
  category?: string;
  source_id?: string;
  time_range?: '3h' | '12h' | '24h' | '3d';
  used?: boolean;
  sort?: 'trend' | 'newest';
  cursor?: string;
  limit?: number;
}

export interface GenerateRequest {
  articleId: string;
  language: 'en' | 'hinglish';
  mode: 'full' | 'regenerate_headlines' | 'shorter' | 'sharper' | 'more_context';
}

export interface SaveTweetRequest {
  url: string;
  article_id?: string;
  cluster_id?: string;
}

export interface SaveDraftRequest {
  article_id: string;
  headline_options?: HeadlineOption[];
  headline?: string;
  caption?: string;
  hashtags?: string[];
  fact_table?: FactEntry[];
  language?: 'en' | 'hinglish';
  template_id?: string;
  design_config?: Record<string, unknown>;
  source_url: string;
  source_outlet?: string;
}

export interface UpdateDraftRequest {
  headline?: string;
  caption?: string;
  hashtags?: string[];
  template_id?: string;
  design_config?: Record<string, unknown>;
  outcome?: 'used_as_is' | 'edited' | 'discarded';
  status?: 'draft' | 'posted';
}

export interface AddStyleExampleRequest {
  kind: 'headline' | 'caption';
  language: 'en' | 'hinglish';
  body: string;
  note?: string;
}

export interface MediaSearchRequest {
  query: string;
  page?: number;
}

// ============================================================================
// API Response types
// ============================================================================

export interface ApiResponse<T> {
  data: T;
  error?: never;
}

export interface ApiError {
  data?: never;
  error: string;
  warning?: string;
}

export type ApiResult<T> = ApiResponse<T> | ApiError;

export interface PaginatedResponse<T> {
  items: T[];
  next_cursor: string | null;
  total?: number;
}

export interface IngestSummary {
  sources_processed: number;
  new_articles: number;
  clusters_updated: number;
  articles_cleaned: number;
  errors: string[];
  duration_ms: number;
}

export interface GenerationOutput {
  headlines: HeadlineOption[];
  caption: string;
  hashtags: string[];
  facts: FactEntry[];
  thin_source_warning: string;
}

export interface MediaItem {
  id: string;
  title: string;
  thumbUrl: string;
  fullUrl: string;
  credit: string;
  creditUrl: string;
  provider: string;
}

export interface SourceStatus {
  id: string;
  name: string;
  type: 'rss' | 'gnews' | 'newsdata';
  url: string | null;
  category: string | null;
  active: boolean;
  last_fetched_at: string | null;
  last_error: string | null;
  created_at: string;
  status: 'ok' | 'stale' | 'error';
  article_count?: number;
}

// ============================================================================
// Normalized article format (used internally by ingest pipeline)
// ============================================================================

export interface NormalizedArticle {
  title: string;
  title_norm: string;
  url: string;
  outlet: string;
  summary: string | null;
  image_url: string | null;
  category: string | null;
  published_at: string | null;
  source_id: string;
}
