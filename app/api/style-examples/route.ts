import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getDb, isDbConfigured } from '@/lib/server/db';
import { addStyleExampleRequestSchema } from '@/lib/shared/schemas';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    if (!isDbConfigured()) {
      return NextResponse.json({ data: [], dbConfigured: false });
    }

    const { searchParams } = new URL(request.url);
    const kind = searchParams.get('kind');
    const language = searchParams.get('language');

    const db = getDb();
    let query = db.from('style_examples').select('*').order('created_at', { ascending: false });

    if (kind) query = query.eq('kind', kind);
    if (language) query = query.eq('language', language);

    const { data, error } = await query;
    if (error) {
      console.warn('Supabase query error in /api/style-examples:', error.message);
      return NextResponse.json({ data: [], dbConfigured: false, error: error.message });
    }

    return NextResponse.json({ data: data || [], dbConfigured: true });
  } catch {
    return NextResponse.json({ data: [], dbConfigured: false, error: 'Failed to fetch style examples' });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isDbConfigured()) {
      return NextResponse.json(
        { error: 'Database not connected. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const parsed = addStyleExampleRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid example data' }, { status: 400 });
    }

    const db = getDb();
    const { data, error } = await db
      .from('style_examples')
      .insert(parsed.data)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to save style example' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!isDbConfigured()) {
      return NextResponse.json({ error: 'Database not connected' }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Example ID required' }, { status: 400 });
    }

    const db = getDb();
    const { error } = await db.from('style_examples').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete example' }, { status: 500 });
  }
}
