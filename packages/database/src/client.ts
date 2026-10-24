import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema/index.js';

export type DatabaseInstance = PostgresJsDatabase<typeof schema>;

let dbInstance: DatabaseInstance | null = null;
let sqlClient: ReturnType<typeof postgres> | null = null;

export function getDatabase(connectionString?: string): DatabaseInstance {
  if (dbInstance) {
    return dbInstance;
  }

  const url = connectionString || process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/marketplace';

  // Real PostgreSQL connection pool
  sqlClient = postgres(url, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });

  dbInstance = drizzle(sqlClient, { schema });
  return dbInstance;
}

export async function closeDatabase(): Promise<void> {
  if (sqlClient) {
    await sqlClient.end();
    sqlClient = null;
    dbInstance = null;
  }
}
