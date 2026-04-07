import postgres from 'postgres';

const connectionString = 'postgresql://postgres:rgIPUeEQBqAQiynBsjyeCSWPeZQEakth@hopper.proxy.rlwy.net:58732/railway';

const sql = postgres(connectionString, {
  ssl: { rejectUnauthorized: false },
  max: 1,
});

async function initNotifications() {
  try {
    console.log('Creating notifications table...');
    await sql`
      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
        user_id TEXT,
        org_id TEXT,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        entity_type TEXT,
        entity_id TEXT,
        read BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    console.log('Creating index on notifications...');
    await sql`CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id)`;
    console.log('Success! Notifications table created.');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

initNotifications();
