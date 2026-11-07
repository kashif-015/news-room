import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getDb, isDbConfigured } from '@/lib/server/db';
import { addSourceRequestSchema } from '@/lib/shared/schemas';
import { fetchRssFeed } from '@/lib/server/ingest/rss';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    if (!isDbConfigured()) {
      return NextResponse.json({ data: [], dbConfigured: false });
    }

    const db = getDb();
    const { data: sources, error } = await db
      .from('sources')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase query error in /api/sources:', error.message);
      return NextResponse.json({ data: [], dbConfigured: false, error: error.message });
    }

    return NextResponse.json({ data: sources || [], dbConfigured: true });
  } catch (err: unknown) {
    return NextResponse.json({ data: [], dbConfigured: false, error: 'Failed to fetch sources' });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = addSourceRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid source data. Provide valid name, type, category, and URL.' },
        { status: 400 }
      );
    }

    const { name, type, url, category } = parsed.data;

    // Test fetch if RSS
    if (type === 'rss') {
      try {
        await fetchRssFeed('temp-id', name, url, category);
      } catch (err: unknown) {
        return NextResponse.json(
          { error: `Unable to read RSS feed: ${err instanceof Error ? err.message : 'Invalid feed'}` },
          { status: 400 }
        );
      }
    }

    const db = getDb();
    const { data, error } = await db
      .from('sources')
      .insert({
        name,
        type,
        url,
        category,
        active: true,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to add source' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, active } = body;

    if (!id || typeof active !== 'boolean') {
      return NextResponse.json({ error: 'Missing id or active status' }, { status: 400 });
    }

    const db = getDb();
    const { data, error } = await db.from('sources').update({ active }).eq('id', id).select().single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: 'Failed to update source' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing source id' }, { status: 400 });
    }

    const db = getDb();
    const { error } = await db.from('sources').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete source' }, { status: 500 });
  }
}

