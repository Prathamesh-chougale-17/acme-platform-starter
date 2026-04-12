import { z } from 'zod';

const optionalUrl = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined))
  .pipe(z.url().optional());

const optionalString = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined));

export const BetterAuthEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.url(),
  BETTER_AUTH_SECRET: z.string().trim().min(32),
  BETTER_AUTH_URL: z.url().default('http://localhost:3000'),
  APP_ORIGIN: z.url().default('http://localhost:3000'),
  API_CORS_ORIGIN: z.string().default('http://localhost:3000'),
  AUTH_FROM_EMAIL: z.string().trim().default('Acme Platform <auth@acme-platform.local>'),
  RESEND_API_KEY: optionalString,
  NEXT_PUBLIC_API_BASE_URL: optionalUrl,
});

export type BetterAuthEnv = z.infer<typeof BetterAuthEnvSchema>;

export const loadBetterAuthEnv = (
  source: Record<string, string | undefined> = process.env,
): BetterAuthEnv => BetterAuthEnvSchema.parse(source);
