import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getDb, isDbConfigured } from '@/lib/server/db';
import { generateRequestSchema } from '@/lib/shared/schemas';
import { extractArticleText } from '@/lib/server/article/extract';
import { generateEditorialPost } from '@/lib/server/ai';
import { getInMemoryArticle } from '@/lib/server/stories-store';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = generateRequestSchema.safeParse(body);

    if (!parsed.success) {
      const msg = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
      console.warn('Generate request validation failed:', msg);
      return NextResponse.json({ error: `Invalid generate request parameters: ${msg}` }, { status: 400 });
    }

    const { articleId, language, mode } = parsed.data;
    let article: { id: string; title: string; url: string; summary: string | null } | null = null;
    let textContent = '';

    // 1. Fetch article metadata from DB if configured
    if (isDbConfigured()) {
      try {
        const db = getDb();
        const { data: dbArticle } = await db
          .from('articles')
          .select('id, title, url, summary')
          .eq('id', articleId)
          .maybeSingle();

        if (dbArticle) {
          article = dbArticle;
          const { data: textRow } = await db
            .from('article_text')
            .select('text_content')
            .eq('article_id', articleId)
            .maybeSingle();
          if (textRow && textRow.text_content) {
            textContent = textRow.text_content;
          }
        }
      } catch {
        // Fallback
      }
    }

    // 2. Check in-memory store
    if (!article) {
      const memArt = getInMemoryArticle(articleId);
      if (memArt) {
        article = {
          id: memArt.id,
          title: memArt.title,
          url: memArt.url,
          summary: memArt.summary,
        };
      }
    }

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    // 3. Extract text if not already loaded
    if (!textContent) {
      const extraction = await extractArticleText(article.url, article.summary);
      textContent = extraction.textContent;

      if (isDbConfigured()) {
        try {
          const db = getDb();
          await db.from('article_text').upsert({
            article_id: articleId,
            text_content: textContent,
            fetched_at: new Date().toISOString(),
          });
        } catch {
          // ignore
        }
      }
    }

    // 4. Load style examples (if DB available)
    let examples: any[] = [];
    if (isDbConfigured()) {
      try {
        const db = getDb();
        const { data: dbExamples } = await db
          .from('style_examples')
          .select('id, kind, language, body, note, created_at')
          .eq('language', language)
          .limit(8);
        examples = dbExamples || [];
      } catch {
        // ignore
      }
    }

    // 5. Generate post via AI
    const result = await generateEditorialPost({
      articleTitle: article.title,
      articleText: textContent || article.summary || article.title,
      language: (language === 'hinglish' ? 'hinglish' : 'en'),
      mode,
      styleExamples: examples,
    });

    return NextResponse.json({
      data: result.output,
      output: result.output,
      provider: result.provider,
      cached: result.cached,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Editorial generation failed' },
      { status: 500 }
    );
  }
}
