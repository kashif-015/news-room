import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { searchPexels } from '@/lib/server/media/pexels';
import { searchUnsplash } from '@/lib/server/media/unsplash';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || 'india news';

  // Try Pexels first
  const pexelsRes = await searchPexels(q);
  if (pexelsRes.results.length > 0) {
    return NextResponse.json(pexelsRes);
  }

  // Fallback to Unsplash
  const unsplashRes = await searchUnsplash(q);
  if (unsplashRes.results.length > 0) {
    return NextResponse.json(unsplashRes);
  }

  return NextResponse.json({
    results: [],
    warning: pexelsRes.warning || unsplashRes.warning || 'No images found. Check API keys.',
  });
}

