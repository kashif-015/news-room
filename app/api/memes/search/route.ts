import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { searchImgflipMemes } from '@/lib/server/media/imgflip';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';

  const results = await searchImgflipMemes(q);
  return NextResponse.json({ results });
}

