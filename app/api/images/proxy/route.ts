import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ALLOWED_HOSTS = [
  'images.pexels.com',
  'images.unsplash.com',
  'i.imgflip.com',
  'media.giphy.com',
  'i.giphy.com',
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return new NextResponse('Missing url parameter', { status: 400 });
  }

  try {
    const parsed = new URL(targetUrl);
    if (!ALLOWED_HOSTS.some((host) => parsed.hostname.endsWith(host))) {
      return new NextResponse('Host not allowed for image proxy', { status: 403 });
    }

    const res = await fetch(targetUrl);
    if (!res.ok) {
      return new NextResponse('Failed to fetch image', { status: res.status });
    }

    const contentType = res.headers.get('content-type') || 'image/jpeg';
    const buffer = await res.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch {
    return new NextResponse('Image proxy error', { status: 500 });
  }
}

