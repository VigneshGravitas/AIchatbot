import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

const connectionString = process.env.POSTGRES_URL;
const pool = new Pool({
  connectionString,
});

// Fix for "too many clients" error during development
declare global {
  var db: ReturnType<typeof drizzle> | undefined;
}

let db: ReturnType<typeof drizzle>;

if (process.env.NODE_ENV === 'production') {
  db = drizzle(pool);
} else {
  if (!global.db) {
    global.db = drizzle(pool);
  }
  db = global.db;
}

export { db };
