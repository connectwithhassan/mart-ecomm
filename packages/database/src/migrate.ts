import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runMigrations(databaseUrl?: string): Promise<void> {
  const url = databaseUrl || process.env.DATABASE_URL;
  if (!url || url.startsWith('memory://')) {
    console.log('ℹ️ DATABASE_URL is in-memory or not set. Skipping live migration runner.');
    return;
  }

  console.log('🚀 Running database migrations...');
  const sql = postgres(url, { max: 1 });
  const db = drizzle(sql);

  try {
    const migrationsFolder = path.resolve(__dirname, './migrations');
    await migrate(db, { migrationsFolder });
    console.log('✅ Migrations applied successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    throw err;
  } finally {
    await sql.end();
  }
}

// Direct execution CLI
if (process.argv[1] && process.argv[1].endsWith('migrate.ts')) {
  runMigrations().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
