import postgres from 'postgres';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const connectionString = process.env.DATABASE_PUBLIC_URL || 'postgresql://postgres:rgIPUeEQBqAQiynBsjyeCSWPeZQEakth@hopper.proxy.rlwy.net:58732/railway';

const sql = postgres(connectionString);

async function runMigration() {
  try {
    const migrationPath = path.join(__dirname, '..', 'migrations', '001-integrations-schema.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('Running migration...');
    
    const statements = migrationSQL.split(';').filter(stmt => stmt.trim());
    for (const statement of statements) {
      if (statement.trim()) {
        await sql.unsafe(statement);
      }
    }
    
    console.log('Migration completed successfully');

    await sql.end();
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
