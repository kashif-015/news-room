import 'server-only';
import { z } from 'zod';

const envSchema = z.object({
  // App security (required in production runtime, fallbacks provided for build)
  APP_PASSWORD: z.string().optional().default(''),
  SESSION_SECRET: z.string().optional().default('default_session_secret_change_in_production_min_32_chars!'),
  CRON_SECRET: z.string().optional().default(''),

  // Database (optional for build / graceful local mode)
  SUPABASE_URL: z.string().optional().default(''),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional().default(''),

  // AI (Gemini required or fallback to OpenRouter)
  GEMINI_API_KEY: z.string().optional().default(''),
  GEMINI_MODEL: z.string().optional().default('gemini-1.5-flash'),
  OPENROUTER_API_KEY: z.string().optional().default(''),
  OPENROUTER_MODEL: z.string().optional().default('meta-llama/llama-3.1-8b-instruct:free'),

  // News (optional)
  GNEWS_API_KEY: z.string().optional().default(''),
  NEWSDATA_API_KEY: z.string().optional().default(''),

  // Media (optional)
  IMGFLIP_USERNAME: z.string().optional().default(''),
  IMGFLIP_PASSWORD: z.string().optional().default(''),
  GIPHY_API_KEY: z.string().optional().default(''),
  PEXELS_API_KEY: z.string().optional().default(''),
  UNSPLASH_APP_ID: z.string().optional().default(''),
  UNSPLASH_ACCESS_KEY: z.string().optional().default(''),
  UNSPLASH_SECRET_KEY: z.string().optional().default(''),

  // Video (optional)
  YOUTUBE_API_KEY: z.string().optional().default(''),

  // Alerts (optional)
  TELEGRAM_BOT_TOKEN: z.string().optional().default(''),
  TELEGRAM_CHAT_ID: z.string().optional().default(''),

  // Config
  APP_URL: z.string().optional().default('http://localhost:3000'),
  NODE_ENV: z.string().optional().default('development'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const missing = parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join(', ');
  console.warn(`Environment warning: ${missing}`);
}

export const env = parsed.success ? parsed.data : envSchema.parse({});

