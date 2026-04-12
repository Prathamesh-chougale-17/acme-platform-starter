import { z } from 'zod';

const optionalUrl = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined))
  .pipe(z.url().optional());

const optionalBooleanFlag = z
  .string()
  .trim()
  .optional()
  .transform((value) => value?.toLowerCase())
  .pipe(z.enum(['true', 'false']).optional())
  .transform((value) => value === 'true');

export const ApiEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  DATABASE_URL: z.url(),
  APP_ORIGIN: z.url().default('http://localhost:3000'),
  API_CORS_ORIGIN: z.string().default('http://localhost:3000'),
  API_SERVICE_NAME: z.string().default('acme-api'),
  API_SENTRY_DSN: optionalUrl,
  API_LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  API_LOG_TO_LOKI: optionalBooleanFlag.default(false),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.url().default('http://localhost:4318'),
  LOKI_URL: z.url().default('http://localhost:3100'),
});

export type ApiEnv = z.infer<typeof ApiEnvSchema>;

export const loadApiEnv = (source: Record<string, string | undefined> = process.env): ApiEnv =>
  ApiEnvSchema.parse(source);
