-- Channel Companion Live Database Schema
-- Run this against your Postgres instance

CREATE TABLE IF NOT EXISTS advisors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  mrr REAL NOT NULL DEFAULT 0,
  pulse TEXT NOT NULL DEFAULT 'Steady',
  trajectory TEXT NOT NULL DEFAULT 'Stable',
  tone TEXT NOT NULL DEFAULT 'Neutral',
  intent TEXT NOT NULL DEFAULT 'Moderate',
  friction TEXT NOT NULL DEFAULT 'Low',
  deal_health TEXT NOT NULL DEFAULT 'Healthy',
  tier TEXT NOT NULL DEFAULT 'other',
  connected_since TEXT,
  comm_preference TEXT,
  best_day_to_reach TEXT,
  referred_by TEXT,
  location TEXT,
  birthday TEXT,
  education TEXT,
  family TEXT,
  hobbies TEXT,
  fun_fact TEXT,
  personal_intel TEXT,
  diagnosis TEXT,
  engagement_breakdown JSONB DEFAULT '{}',
  tsds JSONB DEFAULT '[]',
  previous_companies JSONB DEFAULT '[]',
  mutual_connections JSONB DEFAULT '[]',
  shared_clients JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reps (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  managed_mrr REAL NOT NULL DEFAULT 0,
  active_deals INTEGER NOT NULL DEFAULT 0,
  quota_target REAL NOT NULL DEFAULT 0,
  closed_won INTEGER NOT NULL DEFAULT 0,
  commit_target REAL NOT NULL DEFAULT 0,
  current_commit REAL NOT NULL DEFAULT 0,
  partner_count INTEGER NOT NULL DEFAULT 0,
  partner_capacity INTEGER NOT NULL DEFAULT 30,
  top10 INTEGER NOT NULL DEFAULT 0,
  next20 INTEGER NOT NULL DEFAULT 0,
  other INTEGER NOT NULL DEFAULT 0,
  top_concern TEXT,
  win_rate REAL NOT NULL DEFAULT 0,
  avg_cycle REAL NOT NULL DEFAULT 0,
  engagement_score TEXT NOT NULL DEFAULT 'Steady',
  deals_won_qtd INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS deals (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  advisor_id TEXT REFERENCES advisors(id) ON DELETE CASCADE,
  rep_id TEXT REFERENCES reps(id) ON DELETE SET NULL,
  mrr REAL NOT NULL DEFAULT 0,
  health TEXT NOT NULL DEFAULT 'Healthy',
  stage TEXT NOT NULL DEFAULT 'Discovery',
  probability REAL NOT NULL DEFAULT 0,
  days_in_stage INTEGER NOT NULL DEFAULT 0,
  close_date TEXT,
  competitor TEXT,
  committed BOOLEAN NOT NULL DEFAULT FALSE,
  forecast_history INTEGER NOT NULL DEFAULT 0,
  confidence_score TEXT DEFAULT 'Medium',
  last_modified TEXT,
  override_requested BOOLEAN NOT NULL DEFAULT FALSE,
  override_approved BOOLEAN DEFAULT NULL,
  override_note TEXT,
  action_items JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  advisor_id TEXT REFERENCES advisors(id) ON DELETE CASCADE,
  deal_id TEXT,
  rep_id TEXT,
  author TEXT NOT NULL,
  content TEXT NOT NULL,
  note_type TEXT NOT NULL DEFAULT 'general',
  source TEXT,
  tags JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transcripts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  advisor_id TEXT REFERENCES advisors(id) ON DELETE CASCADE,
  deal_id TEXT,
  rep_id TEXT,
  title TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'manual',
  duration_minutes INTEGER,
  participants JSONB DEFAULT '[]',
  content TEXT NOT NULL,
  summary TEXT,
  key_moments JSONB DEFAULT '[]',
  sentiment TEXT DEFAULT 'Neutral',
  action_items JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS activity_log (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  advisor_id TEXT REFERENCES advisors(id) ON DELETE CASCADE,
  deal_id TEXT,
  rep_id TEXT,
  activity_type TEXT NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS signals (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  advisor_id TEXT NOT NULL REFERENCES advisors(id) ON DELETE CASCADE,
  signal_type TEXT NOT NULL,
  product TEXT,
  value REAL,
  notes TEXT,
  source TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_deals_advisor ON deals(advisor_id);
CREATE INDEX IF NOT EXISTS idx_deals_rep ON deals(rep_id);
CREATE INDEX IF NOT EXISTS idx_deals_stage ON deals(stage);
CREATE INDEX IF NOT EXISTS idx_notes_advisor ON notes(advisor_id);
CREATE INDEX IF NOT EXISTS idx_activity_advisor ON activity_log(advisor_id);
CREATE INDEX IF NOT EXISTS idx_transcripts_advisor ON transcripts(advisor_id);
CREATE INDEX IF NOT EXISTS idx_signals_advisor ON signals(advisor_id);
CREATE INDEX IF NOT EXISTS idx_signals_type ON signals(signal_type);
CREATE INDEX IF NOT EXISTS idx_signals_occurred ON signals(occurred_at);
