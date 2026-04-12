import { loadDbEnv } from '@acme/config';
import { defineConfig } from 'drizzle-kit';

const env = loadDbEnv(process.env);

export default defineConfig({
  out: './packages/db/drizzle',
  schema: './packages/db/src/schema/*.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: env.DATABASE_URL,
  },
  strict: true,
});
