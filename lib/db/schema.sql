-- Channel Companion Live Database Schema
-- Run this against your Railway Postgres instance

CREATE TABLE IF NOT EXISTS advisors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  mrr REAL NOT NULL DEFAULT 0,
  pulse TEXT NOT NULL DEFAULT 'Steady',        -- Strong | Steady | Rising | Fading | Flatline
  trajectory TEXT NOT NULL DEFAULT 'Stable',   -- Accelerating | Climbing | Stable | Slipping | Freefall
  tone TEXT NOT NULL DEFAULT 'Neutral',        -- Warm | Neutral | Cool
  intent TEXT NOT NULL DEFAULT 'Moderate',     -- Strong | Moderate | Low
  friction TEXT NOT NULL DEFAULT 'Low',        -- Low | Moderate | High | Critical
  deal_health TEXT NOT NULL DEFAULT 'Healthy', -- Healthy | Monitor | At Risk | Stalled
  tier TEXT NOT NULL DEFAULT 'other',          -- top10 | next20 | other
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
  advisor_id TEXT NOT NULL REFERENCES advisors(id),
  rep_id TEXT NOT NULL REFERENCES reps(id),
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
  advisor_id TEXT REFERENCES advisors(id),
  deal_id TEXT REFERENCES deals(id),
  rep_id TEXT REFERENCES reps(id),
  author TEXT NOT NULL,
  content TEXT NOT NULL,
  note_type TEXT NOT NULL DEFAULT 'general', -- general | call_note | meeting_note | email | transcript
  source TEXT,                                -- e.g. "Gong", "Manual", "Fireflies"
  tags JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS activity_log (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  advisor_id TEXT REFERENCES advisors(id),
  deal_id TEXT REFERENCES deals(id),
  rep_id TEXT REFERENCES reps(id),
  activity_type TEXT NOT NULL,  -- call | email | meeting | deal_update | note_added | stage_change
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transcripts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  advisor_id TEXT REFERENCES advisors(id),
  deal_id TEXT REFERENCES deals(id),
  rep_id TEXT REFERENCES reps(id),
  title TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'manual', -- gong | fireflies | manual
  duration_minutes INTEGER,
  participants JSONB DEFAULT '[]',
  content TEXT NOT NULL,
  summary TEXT,
  key_moments JSONB DEFAULT '[]',       -- [{timestamp: "2:30", text: "Discussed pricing"}]
  sentiment TEXT DEFAULT 'Neutral',
  action_items JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS briefing_items (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  category TEXT NOT NULL,          -- act_now | capitalize | nurture
  advisor_name TEXT,
  deal_name TEXT,
  action TEXT NOT NULL,
  personal_hook TEXT,
  mrr_at_risk REAL,
  priority INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Signal computation view: derives pulse/trajectory from activity data
CREATE OR REPLACE VIEW advisor_signals AS
SELECT
  a.id,
  a.name,
  a.pulse,
  a.trajectory,
  COUNT(DISTINCT n.id) FILTER (WHERE n.created_at > NOW() - INTERVAL '14 days') as recent_notes,
  COUNT(DISTINCT t.id) FILTER (WHERE t.created_at > NOW() - INTERVAL '30 days') as recent_transcripts,
  COUNT(DISTINCT al.id) FILTER (WHERE al.created_at > NOW() - INTERVAL '7 days') as recent_activity
FROM advisors a
LEFT JOIN notes n ON n.advisor_id = a.id
LEFT JOIN transcripts t ON t.advisor_id = a.id
LEFT JOIN activity_log al ON al.advisor_id = a.id
GROUP BY a.id, a.name, a.pulse, a.trajectory;

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_deals_advisor ON deals(advisor_id);
CREATE INDEX IF NOT EXISTS idx_deals_rep ON deals(rep_id);
CREATE INDEX IF NOT EXISTS idx_deals_stage ON deals(stage);
CREATE INDEX IF NOT EXISTS idx_notes_advisor ON notes(advisor_id);
CREATE INDEX IF NOT EXISTS idx_activity_advisor ON activity_log(advisor_id);
CREATE INDEX IF NOT EXISTS idx_transcripts_advisor ON transcripts(advisor_id);
