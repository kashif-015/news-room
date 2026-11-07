import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getDb, isDbConfigured } from '@/lib/server/db';
import { saveDraftRequestSchema } from '@/lib/shared/schemas';
import { saveInMemoryDraft, getAllInMemoryDrafts } from '@/lib/server/stories-store';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    if (isDbConfigured()) {
      try {
        const db = getDb();
        const { data: drafts, error } = await db
          .from('drafts')
          .select('*')
          .order('updated_at', { ascending: false });

        if (!error && drafts) {
          return NextResponse.json({ data: drafts, dbConfigured: true });
        }
      } catch {
        // Fallback to in-memory
      }
    }

    const memDrafts = getAllInMemoryDrafts();
    return NextResponse.json({ data: memDrafts, dbConfigured: isDbConfigured() });
  } catch (err: unknown) {
    return NextResponse.json({ data: [], dbConfigured: false, error: 'Failed to fetch drafts' });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = saveDraftRequestSchema.safeParse(body);

    if (!parsed.success) {
      const msg = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
      console.warn('Draft save validation failed:', msg);
      return NextResponse.json({ error: `Invalid draft payload: ${msg}` }, { status: 400 });
    }

    if (isDbConfigured()) {
      try {
        const db = getDb();
        const draftPayload = {
          ...parsed.data,
          status: 'draft' as const,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { data: draft, error } = await db
          .from('drafts')
          .insert(draftPayload)
          .select()
          .single();

        if (!error && draft) {
          return NextResponse.json({ data: draft }, { status: 201 });
        }
      } catch {
        // Fallback to in-memory
      }
    }

    // Save in-memory fallback
    const saved = saveInMemoryDraft({
      ...parsed.data,
      status: 'draft',
    });

    return NextResponse.json({ data: saved }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to save draft' }, { status: 500 });
  }
}
