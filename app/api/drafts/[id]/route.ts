import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getDb, isDbConfigured } from '@/lib/server/db';
import { updateDraftRequestSchema } from '@/lib/shared/schemas';
import { getInMemoryDraft, saveInMemoryDraft, deleteInMemoryDraft } from '@/lib/server/stories-store';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (isDbConfigured()) {
      try {
        const db = getDb();
        const { data: draft, error } = await db
          .from('drafts')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (!error && draft) {
          return NextResponse.json({ data: draft });
        }
      } catch {
        // Fallback
      }
    }

    const memDraft = getInMemoryDraft(id);
    if (memDraft) {
      return NextResponse.json({ data: memDraft });
    }

    return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch draft' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = updateDraftRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid draft updates' }, { status: 400 });
    }

    const updates = {
      ...parsed.data,
      updated_at: new Date().toISOString(),
      ...(parsed.data.status === 'posted' ? { posted_at: new Date().toISOString() } : {}),
    };

    if (isDbConfigured()) {
      try {
        const db = getDb();
        const { data: updated, error } = await db
          .from('drafts')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        if (!error && updated) {
          return NextResponse.json({ data: updated });
        }
      } catch {
        // Fallback
      }
    }

    const existing = getInMemoryDraft(id);
    if (existing) {
      const updated = saveInMemoryDraft({
        ...existing,
        ...updates,
      });
      return NextResponse.json({ data: updated });
    }

    return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
  } catch {
    return NextResponse.json({ error: 'Failed to update draft' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (isDbConfigured()) {
      try {
        const db = getDb();
        const { error } = await db.from('drafts').delete().eq('id', id);
        if (!error) {
          return NextResponse.json({ success: true });
        }
      } catch {
        // Fallback
      }
    }

    deleteInMemoryDraft(id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete draft' }, { status: 500 });
  }
}
