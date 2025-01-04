import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

// Load environment variables from .env file
config();

const sql = postgres(process.env.POSTGRES_URL!, { max: 1 });
const db = drizzle(sql);

async function main() {
  if (!process.env.POSTGRES_URL) {
    throw new Error('POSTGRES_URL is not defined');
  }

  try {
    console.log('⏳ Running migrations...');

    const start = Date.now();
    await migrate(db, { migrationsFolder: './drizzle' });
    const end = Date.now();

    console.log('✅ Migrations completed in', end - start, 'ms');
    await sql.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed');
    console.error('Migration failed:', error);
    await sql.end();
    process.exit(1);
  }
}

main();
