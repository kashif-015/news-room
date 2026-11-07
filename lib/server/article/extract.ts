import 'server-only';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';

export interface ExtractionResult {
  title: string | null;
  textContent: string;
  tweetUrls: string[];
  success: boolean;
  warning?: string;
}

/**
 * SSRF validation: only allows public http/https, blocks private IPs and localhost
 */
export function isAllowedUrl(urlString: string): boolean {
  try {
    const parsed = new URL(urlString);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return false;
    }
    const host = parsed.hostname.toLowerCase();
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '::1' ||
      host.endsWith('.local') ||
      host.endsWith('.internal')
    ) {
      return false;
    }

    // Check private IPv4 ranges (10.x, 192.168.x, 172.16.x-31.x)
    const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const match = host.match(ipv4Regex);
    if (match) {
      const b1 = parseInt(match[1], 10);
      const b2 = parseInt(match[2], 10);
      if (b1 === 10) return false;
      if (b1 === 192 && b2 === 168) return false;
      if (b1 === 172 && b2 >= 16 && b2 <= 31) return false;
      if (b1 === 127) return false;
      if (b1 === 0) return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Extract tweet URLs embedded in article HTML
 */
export function extractTweetUrls(html: string): string[] {
  const tweetRegex = /https?:\/\/(?:twitter|x)\.com\/[A-Za-z0-9_]+\/status\/(\d+)/gi;
  const matches = new Set<string>();
  let match;
  while ((match = tweetRegex.exec(html)) !== null) {
    matches.add(match[0].replace('http://', 'https://'));
  }
  return Array.from(matches);
}

/**
 * Fetch and extract article body text using Readability
 */
export async function extractArticleText(url: string, fallbackSummary?: string | null): Promise<ExtractionResult> {
  if (!isAllowedUrl(url)) {
    return {
      title: null,
      textContent: fallbackSummary || 'Invalid or restricted article URL.',
      tweetUrls: [],
      success: false,
      warning: 'URL blocked by security guard.',
    };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 (NewsDesk/1.0 Editorial reader)',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return {
        title: null,
        textContent: fallbackSummary || `HTTP ${response.status} when reading article.`,
        tweetUrls: [],
        success: false,
        warning: `Source returned HTTP ${response.status}. Using summary.`,
      };
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html') && !contentType.includes('xhtml')) {
      return {
        title: null,
        textContent: fallbackSummary || 'Non-HTML content returned.',
        tweetUrls: [],
        success: false,
        warning: 'Article did not return HTML.',
      };
    }

    const html = await response.text();
    // Guard size limit (2MB)
    if (html.length > 2 * 1024 * 1024) {
      return {
        title: null,
        textContent: fallbackSummary || 'Article exceeds 2MB limit.',
        tweetUrls: [],
        success: false,
        warning: 'Article HTML too large.',
      };
    }

    // Extract tweet URLs before dom cleanup
    const tweetUrls = extractTweetUrls(html);

    // Parse with jsdom and Readability
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document, {
      charThreshold: 80,
    });
    const parsedArticle = reader.parse();

    const rawText = parsedArticle?.textContent || '';
    if (!parsedArticle || !rawText.trim()) {
      return {
        title: null,
        textContent: fallbackSummary || 'Could not parse main text. Full article might be behind a paywall or login.',
        tweetUrls,
        success: false,
        warning: 'Article body extraction yielded no text. Using summary.',
      };
    }

    // Clean whitespace
    const cleanText = rawText
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]+/g, ' ')
      .trim();

    return {
      title: parsedArticle.title || null,
      textContent: cleanText,
      tweetUrls,
      success: true,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Extraction error';
    return {
      title: null,
      textContent: fallbackSummary || `Article extraction failed: ${msg}`,
      tweetUrls: [],
      success: false,
      warning: `Extraction failed: ${msg}. Showing available summary.`,
    };
  }
}
