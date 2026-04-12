import { z } from 'zod';

export const DbEnvSchema = z.object({
  DATABASE_URL: z.url(),
});

export type DbEnv = z.infer<typeof DbEnvSchema>;

export const loadDbEnv = (source: Record<string, string | undefined> = process.env): DbEnv =>
  DbEnvSchema.parse(source);
