import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { getMigrationDatabaseUrl, loadDbEnv } from '@acme/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);
const migrationsFolder = path.resolve(currentDir, '../drizzle');

const main = async () => {
  const env = loadDbEnv(process.env);
  const client = postgres(getMigrationDatabaseUrl(env), {
    max: 1,
    prepare: false,
  });

  try {
    console.info(`Applying migrations from ${migrationsFolder}`);

    const db = drizzle(client);
    await migrate(db, { migrationsFolder });

    console.info('Database migrations applied successfully');
  } finally {
    await client.end({ timeout: 5 });
  }
};

try {
  await main();
} catch (error) {
  console.error('Database migration failed');
  console.error(error);
  process.exit(1);
}
