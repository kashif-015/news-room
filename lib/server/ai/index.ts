import 'server-only';
import crypto from 'crypto';
import { getDb, isDbConfigured } from '@/lib/server/db';
import { generateGeminiJson } from './gemini';
import { generateOpenRouterJson } from './openrouter';
import { buildSystemPrompt, buildUserPrompt, PromptInput } from './prompt';
import { runVoiceAndAccuracyChecks, formatFailuresForRetry } from './checks';
import { generationOutputSchema } from '@/lib/shared/schemas';
import { GenerationOutput } from '@/lib/shared/types';

export async function generateEditorialPost(input: PromptInput): Promise<{
  output: GenerationOutput;
  provider: string;
  cached: boolean;
}> {
  const db = getDb();

  // 1. Compute Cache Key
  const exampleHash = crypto
    .createHash('sha256')
    .update(JSON.stringify(input.styleExamples))
    .digest('hex')
    .slice(0, 16);

  const cacheKey = `${input.articleTitle.slice(0, 40)}_${input.language}_${input.mode}_${exampleHash}`;

  // Check cache if DB is configured
  if (isDbConfigured()) {
    try {
      const db = getDb();
      const { data: cachedRow } = await db
        .from('generation_cache')
        .select('output, provider')
        .eq('cache_key', cacheKey)
        .maybeSingle();

      if (cachedRow && cachedRow.output) {
        const parsedCache = generationOutputSchema.safeParse(cachedRow.output);
        if (parsedCache.success) {
          return { output: parsedCache.data, provider: cachedRow.provider || 'cache', cached: true };
        }
      }
    } catch {
      // Continue without cache
    }
  }

  // 2. Prepare Prompts
  const systemPrompt = buildSystemPrompt(input.language);
  let retryFeedback: string | undefined = undefined;
  let parsedOutput: GenerationOutput | null = null;
  let usedProvider = 'gemini';

  // 3. Execution loop (max 3 tries = 1 initial + 2 retries)
  for (let attempt = 0; attempt < 3; attempt++) {
    const userPrompt = buildUserPrompt({ ...input, retryFeedback });
    let rawJson = '';

    try {
      usedProvider = 'gemini';
      rawJson = await generateGeminiJson(systemPrompt, userPrompt);
    } catch (geminiErr: unknown) {
      console.warn('Gemini generation error:', geminiErr);
      // Fallback to OpenRouter
      try {
        usedProvider = 'openrouter';
        rawJson = await generateOpenRouterJson(systemPrompt, userPrompt);
      } catch (fallbackErr: unknown) {
        const geminiMsg = geminiErr instanceof Error ? geminiErr.message : String(geminiErr);
        const fallbackMsg = fallbackErr instanceof Error ? fallbackErr.message : 'Unknown fallback error';
        throw new Error(
          `AI Generation failed: ${geminiMsg}. (Fallback: ${fallbackMsg})`
        );
      }
    }

    try {
      let cleaned = rawJson.trim();
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
      }
      const parsed = JSON.parse(cleaned);
      const validated = generationOutputSchema.parse(parsed);

      // Run voice & accuracy checks
      const failures = runVoiceAndAccuracyChecks(validated, input.articleText);

      if (failures.length === 0 || attempt === 2) {
        parsedOutput = validated;
        break;
      }

      // Prepare feedback for retry
      retryFeedback = formatFailuresForRetry(failures);
    } catch (parseErr) {
      if (attempt === 2) {
        throw new Error('AI output failed schema validation after retries.');
      }
      retryFeedback = 'JSON was malformed or missing required keys (headlines, caption, hashtags, facts).';
    }
  }

  if (!parsedOutput) {
    throw new Error('Could not generate verified post.');
  }

  // 4. Record usage counter
  const today = new Date().toISOString().split('T')[0];
  try {
    const { data: usage } = await db
      .from('api_usage')
      .select('count')
      .eq('day', today)
      .eq('provider', usedProvider)
      .maybeSingle();

    await db.from('api_usage').upsert({
      day: today,
      provider: usedProvider,
      count: (usage?.count || 0) + 1,
    });
  } catch {
    // Non-blocking usage record
  }

  // 5. Save to Cache
  try {
    await db.from('generation_cache').upsert({
      cache_key: cacheKey,
      output: parsedOutput,
      provider: usedProvider,
      created_at: new Date().toISOString(),
    });
  } catch {
    // Non-blocking cache write
  }

  return { output: parsedOutput, provider: usedProvider, cached: false };
}

