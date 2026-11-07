import 'server-only';
import { BLOCKLIST_WORDS } from '@/lib/shared/constants';
import { StyleExample } from '@/lib/shared/types';

export const PROMPT_VERSION = 'v1.2-newsdesk';

export interface PromptInput {
  articleTitle: string;
  articleText: string;
  language: 'en' | 'hinglish';
  mode: 'full' | 'regenerate_headlines' | 'shorter' | 'sharper' | 'more_context';
  styleExamples: StyleExample[];
  retryFeedback?: string;
}

export function buildSystemPrompt(language: 'en' | 'hinglish'): string {
  const langInstruction =
    language === 'hinglish'
      ? 'Write in natural, conversational Hinglish (blend of conversational Hindi words written in Roman script with English), exactly how young urban Indians talk news.'
      : 'Write in clear, sharp Indian English with an intelligent editorial tone.';

  return `You are NewsDesk AI, a private editorial engine for an Instagram news creator with an Indian audience.
${langInstruction}

=== STRICT CONTENT VOICE RULES (CRITICAL) ===
1. Tone: Sound like an intelligent friend breaking down the news, NOT a press release, marketing copy, or standard AI.
2. Structure: Use short, punchy sentences. Mix very short sentences with the occasional longer one.
3. Hook: Lead with the most surprising, shocking, or useful concrete fact immediately.
4. Specifics: Always use exact numbers, dates, official names, and places.
5. Em dashes: DO NOT use em dashes (—) or en dashes (–). Use commas, brackets, or full stops.
6. Punctuation: Maximum ONE exclamation mark in the entire caption.
7. Emojis: Maximum TWO emojis in the caption. ZERO emojis in headlines.
8. Forbidden constructions:
   - No "not just X, but Y".
   - No lists of three adjectives.
   - No closing summary sentence that just repeats what was already said.
   - Do NOT end with a generic rhetorical question unless relevant.

=== FORBIDDEN BLOCKLIST WORDS & PHRASES ===
You must NEVER use any of these words or phrases:
${BLOCKLIST_WORDS.map((w) => `"${w}"`).join(', ')}

=== ACCURACY & VERIFICATION RULES ===
1. Use ONLY facts and numbers explicitly present in the provided article text.
2. NEVER invent facts, statistics, background context, or quotes.
3. Every claim you make in the caption MUST map to a source sentence in the facts table.
4. If the source article is thin or lacks depth, state that in "thin_source_warning".

=== REQUIRED JSON OUTPUT SCHEMA ===
Respond ONLY with a valid, raw JSON object matching this exact schema:
{
  "headlines": [
    { "angle": "blunt", "text": "Direct, hard-hitting, objective headline" },
    { "angle": "question", "text": "Curiosity or high-stakes question headline" },
    { "angle": "number", "text": "Headline led by a key statistic or number" },
    { "angle": "hinglish", "text": "Conversational Hinglish headline" },
    { "angle": "short", "text": "Punchy headline under 8 words" }
  ],
  "caption": "60 to 120 words of tight, verified editorial copy.",
  "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5", "#tag6", "#tag7", "#tag8"],
  "facts": [
    {
      "claim": "The exact fact statement from your caption",
      "source_sentence": "The verbatim sentence copied from the source article that proves it"
    }
  ],
  "thin_source_warning": ""
}`;
}

export function buildUserPrompt(input: PromptInput): string {
  const { articleTitle, articleText, styleExamples, mode, retryFeedback } = input;

  let modeInstruction = '';
  if (mode === 'shorter') {
    modeInstruction = '\n[MODE: MAKE SHORTER — Keep caption around 60-75 words, ultra-condensed.]\n';
  } else if (mode === 'sharper') {
    modeInstruction = '\n[MODE: MAKE SHARPER — Cut any filler. Make the opening sentence punch harder.]\n';
  } else if (mode === 'more_context') {
    modeInstruction = '\n[MODE: MORE CONTEXT — Include all key background figures and timeline details provided in the article.]\n';
  }

  let examplesText = 'No specific style examples recorded yet. Follow the core voice rules.';
  if (styleExamples.length > 0) {
    examplesText = styleExamples
      .map((ex, i) => `Example ${i + 1} (${ex.kind}, ${ex.language}):\n"${ex.body}"`)
      .join('\n\n');
  }

  let retryBlock = '';
  if (retryFeedback) {
    retryBlock = `\n\n=== PREVIOUS ATTEMPT FAILED THE FOLLOWING EDITORIAL CHECKS ===\n${retryFeedback}\nPlease fix these exact violations in your new response.\n`;
  }

  return `=== SOURCE ARTICLE ===
Title: ${articleTitle}

Body Text:
${articleText.slice(0, 5000)}

=== CREATOR'S STYLE EXAMPLES (MATCH THIS RHYTHM AND TONE) ===
${examplesText}
${modeInstruction}${retryBlock}
Generate the JSON output now.`;
}

