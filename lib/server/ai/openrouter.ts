import 'server-only';
import { env } from '@/lib/server/env';

const FALLBACK_MODELS = [
  env.OPENROUTER_MODEL,
  'openrouter/free',
  'meta-llama/llama-3.2-3b-instruct:free',
  'google/gemini-2.0-flash-exp:free',
  'mistralai/mistral-7b-instruct:free',
  'meta-llama/llama-3.1-8b-instruct',
].filter(Boolean) as string[];

// Remove duplicates
const CANDIDATE_MODELS = Array.from(new Set(FALLBACK_MODELS));

export async function generateOpenRouterJson(systemPrompt: string, userPrompt: string): Promise<string> {
  if (!env.OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY is not configured');
  }

  const url = 'https://openrouter.ai/api/v1/chat/completions';
  const baseHeaders = {
    Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': env.APP_URL || 'http://localhost:3000',
    'X-Title': 'NewsDesk Editorial Desk',
  };

  let lastErrorText = '';

  for (const model of CANDIDATE_MODELS) {
    try {
      const payload: Record<string, unknown> = {
        model,
        messages: [
          {
            role: 'system',
            content: `${systemPrompt}\n\nIMPORTANT: Return ONLY a raw valid JSON object. No explanation, no markdown ticks.`,
          },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.65,
      };

      let response = await fetch(url, {
        method: 'POST',
        headers: baseHeaders,
        body: JSON.stringify(payload),
      });

      // If the model fails (404 unavailable, 429 rate limited, etc.), try next candidate
      if (!response.ok) {
        lastErrorText = await response.text();
        console.warn(`OpenRouter model ${model} failed (${response.status}):`, lastErrorText.slice(0, 150));
        continue;
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content;

      if (!text) {
        continue;
      }

      // Strip markdown code fences if present
      let cleaned = text.trim();
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
      }

      return cleaned;
    } catch (err) {
      lastErrorText = err instanceof Error ? err.message : String(err);
      continue;
    }
  }

  throw new Error(`OpenRouter failed on all fallback models. Last error: ${lastErrorText.slice(0, 200)}`);
}
