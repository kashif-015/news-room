export const CATEGORIES = [
  { id: 'general', label: 'General' },
  { id: 'politics', label: 'Politics' },
  { id: 'tech', label: 'Technology' },
  { id: 'business', label: 'Business' },
  { id: 'sports', label: 'Sports' },
  { id: 'world', label: 'World' },
  { id: 'entertainment', label: 'Entertainment' },
] as const;

export const TIME_RANGES = [
  { id: '3h', label: 'Last 3h', hours: 3 },
  { id: '12h', label: 'Last 12h', hours: 12 },
  { id: '24h', label: 'Last 24h', hours: 24 },
  { id: '3d', label: 'Last 3 days', hours: 72 },
] as const;

export const HEADLINE_ANGLES = [
  { id: 'blunt', label: 'BLUNT', description: 'Direct, factual, no frills' },
  { id: 'question', label: 'QUESTION', description: 'Provocative or curious question' },
  { id: 'number', label: 'NUMBER-LED', description: 'Leads with key metric or stat' },
  { id: 'hinglish', label: 'HINGLISH', description: 'Natural conversational Hinglish' },
  { id: 'short', label: 'SHORT', description: 'Punchy under 8 words' },
] as const;

export const TEMPLATES = [
  { id: 'template-a', name: 'Headline on Photo', description: 'Full-bleed imagery with high-contrast Fraunces type' },
  { id: 'template-b', name: 'Bold Text Card', description: 'Solid editorial card with signature orange highlight' },
  { id: 'template-c', name: 'Tweet Quote', description: 'Curated reaction with italic Fraunces tweet quote' },
] as const;

// Blocklist words and phrases from PRD Section 7
export const BLOCKLIST_WORDS = [
  'delve',
  'landscape',
  'realm',
  'tapestry',
  'testament',
  'game-changer',
  'game changing',
  'revolutionize',
  'unlock',
  'elevate',
  'navigate',
  "in today's fast-paced world",
  'in an era of',
  "it's important to note",
  "it's worth noting",
  'buckle up',
  "let's dive in",
  "here's the thing",
  'the bottom line',
  'stay tuned',
  'only time will tell',
  'a stark reminder',
  'sends shockwaves',
  'amid',
  'sparks debate',
  'raises questions',
] as const;

