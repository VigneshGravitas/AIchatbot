import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { migrate } from 'drizzle-orm/postgres-js/migrator';

const connectionString = process.env.POSTGRES_URL || 'postgresql://postgres:postgres123@localhost:5432/chatbot';

async function dropAndRecreateDatabase() {
  try {
    // Connect to postgres database to drop and create chatbot database
    const sql = postgres(connectionString.replace('/chatbot', '/postgres'), { max: 1 });
    
    // Drop existing connections
    await sql`
      SELECT pg_terminate_backend(pg_stat_activity.pid)
      FROM pg_stat_activity
      WHERE pg_stat_activity.datname = 'chatbot'
      AND pid <> pg_backend_pid();
    `;
    
    // Drop and recreate database
    await sql`DROP DATABASE IF EXISTS chatbot;`;
    await sql`CREATE DATABASE chatbot;`;
    
    console.log('Database dropped and recreated');
    
    // Close postgres connection
    await sql.end();
    
    // Connect to chatbot database and run migrations
    const db = drizzle(postgres(connectionString));
    
    console.log('Running migrations...');
    await migrate(db, { migrationsFolder: 'lib/db/migrations' });
    console.log('Migrations complete');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

dropAndRecreateDatabase();
