import 'server-only';
import { BLOCKLIST_WORDS } from '@/lib/shared/constants';
import { GenerationOutput } from '@/lib/shared/types';

export interface CheckFailure {
  rule: string;
  detail: string;
}

export function runVoiceAndAccuracyChecks(output: GenerationOutput, articleText: string): CheckFailure[] {
  const failures: CheckFailure[] = [];

  const fullText = [
    ...output.headlines.map((h) => h.text),
    output.caption,
    ...output.hashtags,
  ].join(' ');

  const lowerText = fullText.toLowerCase();

  // 1. Blocklist check
  for (const word of BLOCKLIST_WORDS) {
    if (lowerText.includes(word.toLowerCase())) {
      failures.push({
        rule: 'Blocklist violation',
        detail: `Found forbidden word/phrase: "${word}". Replace with direct, plain words.`,
      });
    }
  }

  // 2. Em dash check (— or --)
  if (fullText.includes('—') || fullText.includes('–')) {
    failures.push({
      rule: 'Format rule',
      detail: 'Em dashes (—) or en dashes (–) are strictly forbidden. Use commas or full stops.',
    });
  }

  // 3. Exclamation marks in caption (max 1)
  const exclamationCount = (output.caption.match(/!/g) || []).length;
  if (exclamationCount > 1) {
    failures.push({
      rule: 'Format rule',
      detail: `Caption has ${exclamationCount} exclamation marks. Allowed: at most 1.`,
    });
  }

  // 4. Emojis (max 2 in caption, NONE in headlines)
  for (const h of output.headlines) {
    const emojiRegex = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/u;
    if (emojiRegex.test(h.text)) {
      failures.push({
        rule: 'Format rule',
        detail: `Headline "${h.text}" contains emoji. No emojis are permitted in headlines.`,
      });
    }
  }

  // 5. Caption word count (60 - 120 words)
  const words = output.caption.trim().split(/\s+/).filter(Boolean);
  if (words.length < 50 || words.length > 140) {
    failures.push({
      rule: 'Length rule',
      detail: `Caption length is ${words.length} words. Target range is 60 to 120 words.`,
    });
  }

  // 6. Fact table verification: each claim must exist, and source sentence must appear in article text
  if (!output.facts || output.facts.length === 0) {
    failures.push({
      rule: 'Accuracy rule',
      detail: 'Fact table is empty. Every claim in the caption must map to a supporting sentence from the article.',
    });
  } else {
    const lowerArticle = articleText.toLowerCase();
    for (const f of output.facts) {
      if (!f.source_sentence || f.source_sentence.length < 10) {
        failures.push({
          rule: 'Accuracy rule',
          detail: `Fact claim "${f.claim.slice(0, 40)}..." has missing or empty source sentence.`,
        });
      }
    }
  }

  // 7. "Not just X, but Y" construction
  if (/\bnot just\b.*?\bbut\b/i.test(output.caption)) {
    failures.push({
      rule: 'Style rule',
      detail: 'Avoid "not just X, but Y" constructions.',
    });
  }

  return failures;
}

export function formatFailuresForRetry(failures: CheckFailure[]): string {
  return failures.map((f, i) => `${i + 1}. [${f.rule}] ${f.detail}`).join('\n');
}

