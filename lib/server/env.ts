import 'server-only';
import { z } from 'zod';

const envSchema = z.object({
  // App security (required)
  APP_PASSWORD: z.string().min(1, 'APP_PASSWORD is required'),
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must be at least 32 characters'),
  CRON_SECRET: z.string().min(1, 'CRON_SECRET is required'),

  // Database (required)
  SUPABASE_URL: z.string().url('SUPABASE_URL must be a valid URL'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),

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
  throw new Error(`Environment validation failed: ${missing}`);
}

export const env = parsed.data;

