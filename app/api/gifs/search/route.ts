import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { searchGiphy } from '@/lib/server/media/giphy';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || 'news';

  const { results, warning } = await searchGiphy(q);
  return NextResponse.json({ results, warning });
}

