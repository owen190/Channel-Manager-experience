import { NextResponse } from 'next/server';
import postgres from 'postgres';

export async function POST() {
  const connectionString = process.env.DATABASE_URL || process.env.DATABASE_PUBLIC_URL;
  if (!connectionString) {
    return NextResponse.json({ error: 'No DATABASE_URL configured' }, { status: 500 });
  }

  const sql = postgres(connectionString, { max: 1 });

  try {
    const results: string[] = [];

    await sql.unsafe(`CREATE TABLE IF NOT EXISTS integrations (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
      org_id TEXT, type TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'disconnected',
      credentials JSONB DEFAULT '{}', settings JSONB DEFAULT '{}',
      last_sync TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`);
    await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_integrations_org ON integrations(org_id)`);
    await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_integrations_type ON integrations(type)`);
    await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_integrations_status ON integrations(status)`);
    results.push('integrations table + indexes');

    await sql.unsafe(`CREATE TABLE IF NOT EXISTS audit_log (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
      org_id TEXT, user_id TEXT, action TEXT NOT NULL, entity_type TEXT NOT NULL,
      entity_id TEXT, details JSONB, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`);
    await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_audit_log_org ON audit_log(org_id)`);
    await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id)`);
    await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action)`);
    await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at DESC)`);
    results.push('audit_log table + indexes');

    await sql.unsafe(`CREATE TABLE IF NOT EXISTS transcripts (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
      advisor_id TEXT, source TEXT, transcript_text TEXT, participants JSONB,
      recorded_at TIMESTAMPTZ, metadata JSONB, sentiment_score NUMERIC,
      key_topics TEXT[], action_items TEXT[],
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`);
    await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_transcripts_advisor ON transcripts(advisor_id)`);
    await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_transcripts_source ON transcripts(source)`);
    await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_transcripts_created ON transcripts(created_at DESC)`);
    results.push('transcripts table ensured');

    await sql.unsafe(`ALTER TABLE advisors ADD COLUMN IF NOT EXISTS email TEXT`);
    await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_advisors_email ON advisors(email)`);
    results.push('advisors email column');

    await sql.unsafe(`CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
      org_id TEXT, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL DEFAULT 'member', status TEXT NOT NULL DEFAULT 'active',
      last_active TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`);
    await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_users_org ON users(org_id)`);
    await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
    await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_users_status ON users(status)`);
    results.push('users table + indexes');

    await sql.unsafe(`CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
      user_id TEXT, org_id TEXT, type TEXT NOT NULL, title TEXT NOT NULL,
      message TEXT, entity_type TEXT, entity_id TEXT,
      read BOOLEAN NOT NULL DEFAULT FALSE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`);
    await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id)`);
    await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read)`);
    await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC)`);
    results.push('notifications table + indexes');

    await sql.end();
    return NextResponse.json({ success: true, results });
  } catch (err: any) {
    await sql.end();
    console.error('[API] POST /api/live/migrate error:', err);
    return NextResponse.json({ error: err.message || 'Migration failed' }, { status: 500 });
  }
}
