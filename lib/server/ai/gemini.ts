import 'server-only';
import { env } from '@/lib/server/env';

export async function generateGeminiJson(systemPrompt: string, userPrompt: string): Promise<string> {
  if (!env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  // Google AI Studio API keys strictly start with "AIzaSy"
  if (!env.GEMINI_API_KEY.startsWith('AIza')) {
    throw new Error(
      `Invalid Gemini key format (keys start with "AIzaSy..."). The provided key starts with "${env.GEMINI_API_KEY.slice(
        0,
        6
      )}". Get an API key from https://aistudio.google.com/app/apikey.`
    );
  }

  const model = env.GEMINI_MODEL || 'gemini-1.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`;

  const payload = {
    contents: [
      {
        role: 'user',
        parts: [
          { text: `${systemPrompt}\n\n${userPrompt}` },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.65,
      responseMimeType: 'application/json',
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errorText.slice(0, 200)}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error('Gemini returned an empty candidate response');
  }

  return text;
}
