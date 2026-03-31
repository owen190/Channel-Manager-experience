/**
 * Database layer for Channel Companion Live
 * Connects to Postgres via DATABASE_URL
 *
 * Uses the `postgres` npm package (pure JS, no native deps).
 * All API routes call methods on the `db` export — nothing else changes.
 */

import postgres from 'postgres';

// ============ TYPES ============

export interface LiveAdvisor {
  id: string;
  name: string;
  title: string;
  company: string;
  mrr: number;
  pulse: string;
  trajectory: string;
  tone: string;
  intent: string;
  friction: string;
  dealHealth: string;
  tier: string;
  connectedSince?: string;
  commPreference?: string;
  bestDayToReach?: string;
  referredBy?: string;
  location?: string;
  birthday?: string;
  education?: string;
  family?: string;
  hobbies?: string;
  funFact?: string;
  personalIntel?: string;
  diagnosis?: string;
  engagementBreakdown?: Record<string, number>;
  tsds?: string[];
  previousCompanies?: string[];
  mutualConnections?: string[];
  sharedClients?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface LiveRep {
  id: string;
  name: string;
  title: string;
  managedMRR: number;
  activeDeals: number;
  quotaTarget: number;
  closedWon: number;
  commitTarget: number;
  currentCommit: number;
  partnerCount: number;
  partnerCapacity: number;
  top10: number;
  next20: number;
  other: number;
  topConcern?: string;
  winRate: number;
  avgCycle: number;
  engagementScore: string;
  dealsWonQTD: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface LiveDeal {
  id: string;
  name: string;
  advisorId: string;
  repId: string;
  mrr: number;
  health: string;
  stage: string;
  probability: number;
  daysInStage: number;
  closeDate?: string;
  competitor?: string;
  committed: boolean;
  forecastHistory: number;
  confidenceScore?: string;
  lastModified?: string;
  overrideRequested: boolean;
  overrideApproved?: boolean;
  overrideNote?: string;
  actionItems?: Array<{ id: string; text: string; daysOld: number; assignedTo: string; status: string }>;
  createdAt?: string;
  updatedAt?: string;
}

export interface LiveNote {
  id: string;
  advisorId?: string;
  dealId?: string;
  repId?: string;
  author: string;
  content: string;
  noteType: string;
  source?: string;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface LiveTranscript {
  id: string;
  advisorId?: string;
  dealId?: string;
  repId?: string;
  title: string;
  source: string;
  durationMinutes?: number;
  participants?: string[];
  content: string;
  summary?: string;
  keyMoments?: Array<{ timestamp: string; text: string }>;
  sentiment?: string;
  actionItems?: Array<{ text: string; assignedTo?: string }>;
  createdAt?: string;
}

export interface LiveActivity {
  id: string;
  advisorId?: string;
  dealId?: string;
  repId?: string;
  activityType: string;
  description: string;
  metadata?: Record<string, unknown>;
  createdAt?: string;
}

export type SignalType =
  | 'quote_request'
  | 'product_inquiry'
  | 'pricing_request'
  | 'demo_request'
  | 'technical_eval'
  | 'training_completed'
  | 'portal_login'
  | 'spec_download';

export interface EngagementSignal {
  id: string;
  advisorId: string;
  signalType: SignalType;
  product?: string;
  value?: number;
  notes?: string;
  source?: string;
  occurredAt: string;
  createdAt?: string;
}

export interface RevenueIntent {
  advisorId: string;
  advisorName: string;
  score: number;
  label: 'Hot' | 'Warm' | 'Interested' | 'Cold';
  signals30d: number;
  signals90d: number;
  lastSignalDate: string;
  topProducts: string[];
  quoteCount30d: number;
  totalEstimatedValue: number;
}

// ============ POSTGRES CONNECTION ============

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn('[DB] WARNING: DATABASE_URL not set. Database operations will fail.');
}

const sql = postgres(connectionString || 'postgres://localhost:5432/channel_companion', {
  ssl: connectionString?.includes('railway') || connectionString?.includes('neon') || connectionString?.includes('supabase')
    ? { rejectUnauthorized: false }
    : false,
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

// ============ HELPERS ============

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/** Map a Postgres row (snake_case) to a LiveAdvisor (camelCase) */
function rowToAdvisor(r: any): LiveAdvisor {
  return {
    id: r.id,
    name: r.name,
    title: r.title,
    company: r.company,
    mrr: Number(r.mrr),
    pulse: r.pulse,
    trajectory: r.trajectory,
    tone: r.tone,
    intent: r.intent,
    friction: r.friction,
    dealHealth: r.deal_health,
    tier: r.tier,
    connectedSince: r.connected_since || undefined,
    commPreference: r.comm_preference || undefined,
    bestDayToReach: r.best_day_to_reach || undefined,
    referredBy: r.referred_by || undefined,
    location: r.location || undefined,
    birthday: r.birthday || undefined,
    education: r.education || undefined,
    family: r.family || undefined,
    hobbies: r.hobbies || undefined,
    funFact: r.fun_fact || undefined,
    personalIntel: r.personal_intel || undefined,
    diagnosis: r.diagnosis || undefined,
    engagementBreakdown: r.engagement_breakdown || {},
    tsds: r.tsds || [],
    previousCompanies: r.previous_companies || [],
    mutualConnections: r.mutual_connections || [],
    sharedClients: r.shared_clients || [],
    createdAt: r.created_at?.toISOString?.() || r.created_at,
    updatedAt: r.updated_at?.toISOString?.() || r.updated_at,
  };
}

function rowToRep(r: any): LiveRep {
  return {
    id: r.id,
    name: r.name,
    title: r.title,
    managedMRR: Number(r.managed_mrr),
    activeDeals: Number(r.active_deals),
    quotaTarget: Number(r.quota_target),
    closedWon: Number(r.closed_won),
    commitTarget: Number(r.commit_target),
    currentCommit: Number(r.current_commit),
    partnerCount: Number(r.partner_count),
    partnerCapacity: Number(r.partner_capacity),
    top10: Number(r.top10),
    next20: Number(r.next20),
    other: Number(r.other),
    topConcern: r.top_concern || undefined,
    winRate: Number(r.win_rate),
    avgCycle: Number(r.avg_cycle),
    engagementScore: r.engagement_score,
    dealsWonQTD: Number(r.deals_won_qtd),
    createdAt: r.created_at?.toISOString?.() || r.created_at,
    updatedAt: r.updated_at?.toISOString?.() || r.updated_at,
  };
}

function rowToDeal(r: any): LiveDeal {
  return {
    id: r.id,
    name: r.name,
    advisorId: r.advisor_id,
    repId: r.rep_id || '',
    mrr: Number(r.mrr),
    health: r.health,
    stage: r.stage,
    probability: Number(r.probability),
    daysInStage: Number(r.days_in_stage),
    closeDate: r.close_date || undefined,
    competitor: r.competitor || undefined,
    committed: Boolean(r.committed),
    forecastHistory: Number(r.forecast_history),
    confidenceScore: r.confidence_score || undefined,
    lastModified: r.last_modified || undefined,
    overrideRequested: Boolean(r.override_requested),
    overrideApproved: r.override_approved ?? undefined,
    overrideNote: r.override_note || undefined,
    actionItems: r.action_items || [],
    createdAt: r.created_at?.toISOString?.() || r.created_at,
    updatedAt: r.updated_at?.toISOString?.() || r.updated_at,
  };
}

function rowToNote(r: any): LiveNote {
  return {
    id: r.id,
    advisorId: r.advisor_id || undefined,
    dealId: r.deal_id || undefined,
    repId: r.rep_id || undefined,
    author: r.author,
    content: r.content,
    noteType: r.note_type,
    source: r.source || undefined,
    tags: r.tags || [],
    createdAt: r.created_at?.toISOString?.() || r.created_at,
    updatedAt: r.updated_at?.toISOString?.() || r.updated_at,
  };
}

function rowToTranscript(r: any): LiveTranscript {
  return {
    id: r.id,
    advisorId: r.advisor_id || undefined,
    dealId: r.deal_id || undefined,
    repId: r.rep_id || undefined,
    title: r.title,
    source: r.source,
    durationMinutes: r.duration_minutes != null ? Number(r.duration_minutes) : undefined,
    participants: r.participants || [],
    content: r.content,
    summary: r.summary || undefined,
    keyMoments: r.key_moments || [],
    sentiment: r.sentiment || undefined,
    actionItems: r.action_items || [],
    createdAt: r.created_at?.toISOString?.() || r.created_at,
  };
}

function rowToActivity(r: any): LiveActivity {
  return {
    id: r.id,
    advisorId: r.advisor_id || undefined,
    dealId: r.deal_id || undefined,
    repId: r.rep_id || undefined,
    activityType: r.activity_type,
    description: r.description,
    metadata: r.metadata || {},
    createdAt: r.created_at?.toISOString?.() || r.created_at,
  };
}

function rowToSignal(r: any): EngagementSignal {
  return {
    id: r.id,
    advisorId: r.advisor_id,
    signalType: r.signal_type as SignalType,
    product: r.product || undefined,
    value: r.value != null ? Number(r.value) : undefined,
    notes: r.notes || undefined,
    source: r.source || undefined,
    occurredAt: r.occurred_at?.toISOString?.() || r.occurred_at,
    createdAt: r.created_at?.toISOString?.() || r.created_at,
  };
}

// ============ DATABASE OPERATIONS ============

export const db = {
  // --- Advisors ---
  async getAdvisors(): Promise<LiveAdvisor[]> {
    const rows = await sql`SELECT * FROM advisors ORDER BY name`;
    return rows.map(rowToAdvisor);
  },

  async getAdvisor(id: string): Promise<LiveAdvisor | null> {
    const rows = await sql`SELECT * FROM advisors WHERE id = ${id}`;
    return rows.length > 0 ? rowToAdvisor(rows[0]) : null;
  },

  async upsertAdvisor(advisor: Partial<LiveAdvisor> & { id?: string }): Promise<LiveAdvisor> {
    const id = advisor.id || generateId();
    const now = new Date().toISOString();

    const rows = await sql`
      INSERT INTO advisors (
        id, name, title, company, mrr, pulse, trajectory, tone, intent, friction,
        deal_health, tier, connected_since, comm_preference, best_day_to_reach,
        referred_by, location, birthday, education, family, hobbies, fun_fact,
        personal_intel, diagnosis, engagement_breakdown, tsds, previous_companies,
        mutual_connections, shared_clients, created_at, updated_at
      ) VALUES (
        ${id},
        ${advisor.name || ''},
        ${advisor.title || ''},
        ${advisor.company || ''},
        ${advisor.mrr || 0},
        ${advisor.pulse || 'Steady'},
        ${advisor.trajectory || 'Stable'},
        ${advisor.tone || 'Neutral'},
        ${advisor.intent || 'Moderate'},
        ${advisor.friction || 'Low'},
        ${advisor.dealHealth || 'Healthy'},
        ${advisor.tier || 'other'},
        ${advisor.connectedSince || null},
        ${advisor.commPreference || null},
        ${advisor.bestDayToReach || null},
        ${advisor.referredBy || null},
        ${advisor.location || null},
        ${advisor.birthday || null},
        ${advisor.education || null},
        ${advisor.family || null},
        ${advisor.hobbies || null},
        ${advisor.funFact || null},
        ${advisor.personalIntel || null},
        ${advisor.diagnosis || null},
        ${sql.json(advisor.engagementBreakdown || {})},
        ${sql.json(advisor.tsds || [])},
        ${sql.json(advisor.previousCompanies || [])},
        ${sql.json(advisor.mutualConnections || [])},
        ${sql.json(advisor.sharedClients || [])},
        ${now},
        ${now}
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        title = EXCLUDED.title,
        company = EXCLUDED.company,
        mrr = EXCLUDED.mrr,
        pulse = EXCLUDED.pulse,
        trajectory = EXCLUDED.trajectory,
        tone = EXCLUDED.tone,
        intent = EXCLUDED.intent,
        friction = EXCLUDED.friction,
        deal_health = EXCLUDED.deal_health,
        tier = EXCLUDED.tier,
        connected_since = EXCLUDED.connected_since,
        comm_preference = EXCLUDED.comm_preference,
        best_day_to_reach = EXCLUDED.best_day_to_reach,
        referred_by = EXCLUDED.referred_by,
        location = EXCLUDED.location,
        birthday = EXCLUDED.birthday,
        education = EXCLUDED.education,
        family = EXCLUDED.family,
        hobbies = EXCLUDED.hobbies,
        fun_fact = EXCLUDED.fun_fact,
        personal_intel = EXCLUDED.personal_intel,
        diagnosis = EXCLUDED.diagnosis,
        engagement_breakdown = EXCLUDED.engagement_breakdown,
        tsds = EXCLUDED.tsds,
        previous_companies = EXCLUDED.previous_companies,
        mutual_connections = EXCLUDED.mutual_connections,
        shared_clients = EXCLUDED.shared_clients,
        updated_at = ${now}
      RETURNING *
    `;
    return rowToAdvisor(rows[0]);
  },

  async deleteAdvisor(id: string): Promise<boolean> {
    const result = await sql`DELETE FROM advisors WHERE id = ${id}`;
    return result.count > 0;
  },

  // --- Reps ---
  async getReps(): Promise<LiveRep[]> {
    const rows = await sql`SELECT * FROM reps ORDER BY name`;
    return rows.map(rowToRep);
  },

  async getRep(id: string): Promise<LiveRep | null> {
    const rows = await sql`SELECT * FROM reps WHERE id = ${id}`;
    return rows.length > 0 ? rowToRep(rows[0]) : null;
  },

  async upsertRep(rep: Partial<LiveRep> & { id?: string }): Promise<LiveRep> {
    const id = rep.id || generateId();
    const now = new Date().toISOString();

    const rows = await sql`
      INSERT INTO reps (
        id, name, title, managed_mrr, active_deals, quota_target, closed_won,
        commit_target, current_commit, partner_count, partner_capacity,
        top10, next20, other, top_concern, win_rate, avg_cycle,
        engagement_score, deals_won_qtd, created_at, updated_at
      ) VALUES (
        ${id},
        ${rep.name || ''},
        ${rep.title || ''},
        ${rep.managedMRR || 0},
        ${rep.activeDeals || 0},
        ${rep.quotaTarget || 0},
        ${rep.closedWon || 0},
        ${rep.commitTarget || 0},
        ${rep.currentCommit || 0},
        ${rep.partnerCount || 0},
        ${rep.partnerCapacity || 30},
        ${rep.top10 || 0},
        ${rep.next20 || 0},
        ${rep.other || 0},
        ${rep.topConcern || null},
        ${rep.winRate || 0},
        ${rep.avgCycle || 0},
        ${rep.engagementScore || 'Steady'},
        ${rep.dealsWonQTD || 0},
        ${now},
        ${now}
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        title = EXCLUDED.title,
        managed_mrr = EXCLUDED.managed_mrr,
        active_deals = EXCLUDED.active_deals,
        quota_target = EXCLUDED.quota_target,
        closed_won = EXCLUDED.closed_won,
        commit_target = EXCLUDED.commit_target,
        current_commit = EXCLUDED.current_commit,
        partner_count = EXCLUDED.partner_count,
        partner_capacity = EXCLUDED.partner_capacity,
        top10 = EXCLUDED.top10,
        next20 = EXCLUDED.next20,
        other = EXCLUDED.other,
        top_concern = EXCLUDED.top_concern,
        win_rate = EXCLUDED.win_rate,
        avg_cycle = EXCLUDED.avg_cycle,
        engagement_score = EXCLUDED.engagement_score,
        deals_won_qtd = EXCLUDED.deals_won_qtd,
        updated_at = ${now}
      RETURNING *
    `;
    return rowToRep(rows[0]);
  },

  // --- Deals ---
  async getDeals(): Promise<LiveDeal[]> {
    const rows = await sql`SELECT * FROM deals ORDER BY name`;
    return rows.map(rowToDeal);
  },

  async getDeal(id: string): Promise<LiveDeal | null> {
    const rows = await sql`SELECT * FROM deals WHERE id = ${id}`;
    return rows.length > 0 ? rowToDeal(rows[0]) : null;
  },

  async upsertDeal(deal: Partial<LiveDeal> & { id?: string }): Promise<LiveDeal> {
    const id = deal.id || generateId();
    const now = new Date().toISOString();

    const rows = await sql`
      INSERT INTO deals (
        id, name, advisor_id, rep_id, mrr, health, stage, probability,
        days_in_stage, close_date, competitor, committed, forecast_history,
        confidence_score, last_modified, override_requested, override_approved,
        override_note, action_items, created_at, updated_at
      ) VALUES (
        ${id},
        ${deal.name || ''},
        ${deal.advisorId || null},
        ${deal.repId || null},
        ${deal.mrr || 0},
        ${deal.health || 'Healthy'},
        ${deal.stage || 'Discovery'},
        ${deal.probability || 0},
        ${deal.daysInStage || 0},
        ${deal.closeDate || null},
        ${deal.competitor || null},
        ${deal.committed || false},
        ${deal.forecastHistory || 0},
        ${deal.confidenceScore || 'Medium'},
        ${deal.lastModified || null},
        ${deal.overrideRequested || false},
        ${deal.overrideApproved ?? null},
        ${deal.overrideNote || null},
        ${sql.json(deal.actionItems || [])},
        ${now},
        ${now}
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        advisor_id = EXCLUDED.advisor_id,
        rep_id = EXCLUDED.rep_id,
        mrr = EXCLUDED.mrr,
        health = EXCLUDED.health,
        stage = EXCLUDED.stage,
        probability = EXCLUDED.probability,
        days_in_stage = EXCLUDED.days_in_stage,
        close_date = EXCLUDED.close_date,
        competitor = EXCLUDED.competitor,
        committed = EXCLUDED.committed,
        forecast_history = EXCLUDED.forecast_history,
        confidence_score = EXCLUDED.confidence_score,
        last_modified = EXCLUDED.last_modified,
        override_requested = EXCLUDED.override_requested,
        override_approved = EXCLUDED.override_approved,
        override_note = EXCLUDED.override_note,
        action_items = EXCLUDED.action_items,
        updated_at = ${now}
      RETURNING *
    `;
    return rowToDeal(rows[0]);
  },

  // --- Notes ---
  async getNotes(filters?: { advisorId?: string; dealId?: string }): Promise<LiveNote[]> {
    if (filters?.advisorId && filters?.dealId) {
      const rows = await sql`SELECT * FROM notes WHERE advisor_id = ${filters.advisorId} AND deal_id = ${filters.dealId} ORDER BY created_at DESC`;
      return rows.map(rowToNote);
    }
    if (filters?.advisorId) {
      const rows = await sql`SELECT * FROM notes WHERE advisor_id = ${filters.advisorId} ORDER BY created_at DESC`;
      return rows.map(rowToNote);
    }
    if (filters?.dealId) {
      const rows = await sql`SELECT * FROM notes WHERE deal_id = ${filters.dealId} ORDER BY created_at DESC`;
      return rows.map(rowToNote);
    }
    const rows = await sql`SELECT * FROM notes ORDER BY created_at DESC`;
    return rows.map(rowToNote);
  },

  async createNote(note: Omit<LiveNote, 'id' | 'createdAt' | 'updatedAt'>): Promise<LiveNote> {
    const rows = await sql`
      INSERT INTO notes (advisor_id, deal_id, rep_id, author, content, note_type, source, tags)
      VALUES (
        ${note.advisorId || null},
        ${note.dealId || null},
        ${note.repId || null},
        ${note.author},
        ${note.content},
        ${note.noteType},
        ${note.source || null},
        ${sql.json(note.tags || [])}
      )
      RETURNING *
    `;
    return rowToNote(rows[0]);
  },

  // --- Transcripts ---
  async getTranscripts(filters?: { advisorId?: string }): Promise<LiveTranscript[]> {
    if (filters?.advisorId) {
      const rows = await sql`SELECT * FROM transcripts WHERE advisor_id = ${filters.advisorId} ORDER BY created_at DESC`;
      return rows.map(rowToTranscript);
    }
    const rows = await sql`SELECT * FROM transcripts ORDER BY created_at DESC`;
    return rows.map(rowToTranscript);
  },

  async createTranscript(transcript: Omit<LiveTranscript, 'id' | 'createdAt'>): Promise<LiveTranscript> {
    const rows = await sql`
      INSERT INTO transcripts (
        advisor_id, deal_id, rep_id, title, source, duration_minutes,
        participants, content, summary, key_moments, sentiment, action_items
      ) VALUES (
        ${transcript.advisorId || null},
        ${transcript.dealId || null},
        ${transcript.repId || null},
        ${transcript.title},
        ${transcript.source},
        ${transcript.durationMinutes || null},
        ${sql.json(transcript.participants || [])},
        ${transcript.content},
        ${transcript.summary || null},
        ${sql.json(transcript.keyMoments || [])},
        ${transcript.sentiment || 'Neutral'},
        ${sql.json(transcript.actionItems || [])}
      )
      RETURNING *
    `;
    return rowToTranscript(rows[0]);
  },

  // --- Activity Log ---
  async getActivity(filters?: { advisorId?: string; limit?: number }): Promise<LiveActivity[]> {
    const limit = filters?.limit || 100;
    if (filters?.advisorId) {
      const rows = await sql`SELECT * FROM activity_log WHERE advisor_id = ${filters.advisorId} ORDER BY created_at DESC LIMIT ${limit}`;
      return rows.map(rowToActivity);
    }
    const rows = await sql`SELECT * FROM activity_log ORDER BY created_at DESC LIMIT ${limit}`;
    return rows.map(rowToActivity);
  },

  async logActivity(activity: Omit<LiveActivity, 'id' | 'createdAt'>): Promise<LiveActivity> {
    const rows = await sql`
      INSERT INTO activity_log (advisor_id, deal_id, rep_id, activity_type, description, metadata)
      VALUES (
        ${activity.advisorId || null},
        ${activity.dealId || null},
        ${activity.repId || null},
        ${activity.activityType},
        ${activity.description},
        ${sql.json((activity.metadata || {}) as Record<string, any>)}
      )
      RETURNING *
    `;
    return rowToActivity(rows[0]);
  },

  // --- Engagement Signals ---
  async getSignals(filters?: { advisorId?: string; signalType?: SignalType; since?: string }): Promise<EngagementSignal[]> {
    const conditions: string[] = [];

    // Build dynamic query based on filters
    if (filters?.advisorId && filters?.signalType && filters?.since) {
      const rows = await sql`
        SELECT * FROM signals
        WHERE advisor_id = ${filters.advisorId}
          AND signal_type = ${filters.signalType}
          AND occurred_at >= ${filters.since}
        ORDER BY occurred_at DESC
      `;
      return rows.map(rowToSignal);
    }
    if (filters?.advisorId && filters?.signalType) {
      const rows = await sql`
        SELECT * FROM signals
        WHERE advisor_id = ${filters.advisorId} AND signal_type = ${filters.signalType}
        ORDER BY occurred_at DESC
      `;
      return rows.map(rowToSignal);
    }
    if (filters?.advisorId && filters?.since) {
      const rows = await sql`
        SELECT * FROM signals
        WHERE advisor_id = ${filters.advisorId} AND occurred_at >= ${filters.since}
        ORDER BY occurred_at DESC
      `;
      return rows.map(rowToSignal);
    }
    if (filters?.advisorId) {
      const rows = await sql`
        SELECT * FROM signals WHERE advisor_id = ${filters.advisorId}
        ORDER BY occurred_at DESC
      `;
      return rows.map(rowToSignal);
    }
    if (filters?.signalType) {
      const rows = await sql`
        SELECT * FROM signals WHERE signal_type = ${filters.signalType}
        ORDER BY occurred_at DESC
      `;
      return rows.map(rowToSignal);
    }
    if (filters?.since) {
      const rows = await sql`
        SELECT * FROM signals WHERE occurred_at >= ${filters.since}
        ORDER BY occurred_at DESC
      `;
      return rows.map(rowToSignal);
    }
    const rows = await sql`SELECT * FROM signals ORDER BY occurred_at DESC`;
    return rows.map(rowToSignal);
  },

  async createSignal(signal: Omit<EngagementSignal, 'id' | 'createdAt'>): Promise<EngagementSignal> {
    const rows = await sql`
      INSERT INTO signals (advisor_id, signal_type, product, value, notes, source, occurred_at)
      VALUES (
        ${signal.advisorId},
        ${signal.signalType},
        ${signal.product || null},
        ${signal.value || null},
        ${signal.notes || null},
        ${signal.source || null},
        ${signal.occurredAt}
      )
      RETURNING *
    `;
    return rowToSignal(rows[0]);
  },

  async bulkCreateSignals(newSignals: Omit<EngagementSignal, 'id' | 'createdAt'>[]): Promise<number> {
    if (newSignals.length === 0) return 0;

    // Insert signals one at a time (simple and reliable)
    let count = 0;
    for (const signal of newSignals) {
      await sql`
        INSERT INTO signals (advisor_id, signal_type, product, value, notes, source, occurred_at)
        VALUES (
          ${signal.advisorId},
          ${signal.signalType},
          ${signal.product || null},
          ${signal.value || null},
          ${signal.notes || null},
          ${signal.source || null},
          ${signal.occurredAt}
        )
      `;
      count++;
    }
    return count;
  },

  async deleteSignal(id: string): Promise<boolean> {
    const result = await sql`DELETE FROM signals WHERE id = ${id}`;
    return result.count > 0;
  },

  // --- Revenue Intent Computation ---
  async computeRevenueIntent(advisorId?: string): Promise<RevenueIntent[]> {
    const advisors = advisorId
      ? [await this.getAdvisor(advisorId)].filter(Boolean) as LiveAdvisor[]
      : await this.getAdvisors();
    const allSignals = await this.getSignals();
    const now = Date.now();
    const d30 = 30 * 24 * 60 * 60 * 1000;
    const d90 = 90 * 24 * 60 * 60 * 1000;

    const WEIGHTS: Record<SignalType, number> = {
      quote_request: 25,
      pricing_request: 20,
      demo_request: 15,
      technical_eval: 15,
      product_inquiry: 10,
      spec_download: 8,
      training_completed: 5,
      portal_login: 3,
    };

    return advisors.map(advisor => {
      const advisorSignals = allSignals.filter(s => s.advisorId === advisor.id);
      const signals30d = advisorSignals.filter(s => now - new Date(s.occurredAt).getTime() < d30);
      const signals90d = advisorSignals.filter(s => now - new Date(s.occurredAt).getTime() < d90);
      const quoteCount30d = signals30d.filter(s => s.signalType === 'quote_request').length;

      let rawScore = 0;
      for (const s of signals30d) {
        rawScore += (WEIGHTS[s.signalType] || 5) * 1.5;
      }
      for (const s of signals90d.filter(s => now - new Date(s.occurredAt).getTime() >= d30)) {
        rawScore += WEIGHTS[s.signalType] || 5;
      }
      const score = Math.min(100, Math.round(rawScore));

      const label: RevenueIntent['label'] =
        score >= 70 ? 'Hot' : score >= 40 ? 'Warm' : score >= 15 ? 'Interested' : 'Cold';

      const productCounts: Record<string, number> = {};
      for (const s of advisorSignals) {
        if (s.product) productCounts[s.product] = (productCounts[s.product] || 0) + 1;
      }
      const topProducts = Object.entries(productCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([p]) => p);

      const totalEstimatedValue = advisorSignals
        .filter(s => s.value && s.value > 0)
        .reduce((sum, s) => sum + (s.value || 0), 0);

      const lastSignalDate = advisorSignals[0]?.occurredAt || '';

      return {
        advisorId: advisor.id,
        advisorName: advisor.name,
        score,
        label,
        signals30d: signals30d.length,
        signals90d: signals90d.length,
        lastSignalDate,
        topProducts,
        quoteCount30d,
        totalEstimatedValue,
      };
    });
  },

  // --- Aggregate helpers ---
  async getAdvisorContext(advisorId: string) {
    const [advisor, deals, notes, transcripts, activity, signals, revenueIntent] = await Promise.all([
      this.getAdvisor(advisorId),
      this.getDeals().then(d => d.filter(deal => deal.advisorId === advisorId)),
      this.getNotes({ advisorId }),
      this.getTranscripts({ advisorId }),
      this.getActivity({ advisorId, limit: 20 }),
      this.getSignals({ advisorId }),
      this.computeRevenueIntent(advisorId).then(r => r[0] || null),
    ]);

    return { advisor, deals, notes, transcripts, activity, signals, revenueIntent };
  },

  async buildAIContext(advisorId?: string): Promise<string> {
    if (advisorId) {
      const ctx = await this.getAdvisorContext(advisorId);
      if (!ctx.advisor) return 'No advisor found.';

      const parts = [
        `ADVISOR: ${ctx.advisor.name}, ${ctx.advisor.title} at ${ctx.advisor.company}`,
        `MRR: $${(ctx.advisor.mrr / 1000).toFixed(1)}K | Pulse: ${ctx.advisor.pulse} | Trajectory: ${ctx.advisor.trajectory}`,
        `Tone: ${ctx.advisor.tone} | Intent: ${ctx.advisor.intent} | Friction: ${ctx.advisor.friction}`,
        ctx.advisor.personalIntel ? `PERSONAL INTEL: ${ctx.advisor.personalIntel}` : '',
        ctx.advisor.diagnosis ? `DIAGNOSIS: ${ctx.advisor.diagnosis}` : '',
        ctx.advisor.hobbies ? `HOBBIES: ${ctx.advisor.hobbies}` : '',
        ctx.advisor.family ? `FAMILY: ${ctx.advisor.family}` : '',
        '',
        ctx.revenueIntent ? `REVENUE INTENT: ${ctx.revenueIntent.label} (${ctx.revenueIntent.score}/100) | ${ctx.revenueIntent.signals30d} signals in 30d | ${ctx.revenueIntent.quoteCount30d} quotes | Top products: ${ctx.revenueIntent.topProducts.join(', ') || 'None'}` : '',
        '',
        `ENGAGEMENT SIGNALS (${ctx.signals.length} total, recent first):`,
        ...ctx.signals.slice(0, 10).map(s => `- [${s.signalType}] ${s.product || ''} ${s.value ? '$' + (s.value/1000).toFixed(1) + 'K' : ''} — ${new Date(s.occurredAt).toLocaleDateString()} ${s.notes ? '(' + s.notes + ')' : ''}`),
        '',
        `DEALS (${ctx.deals.length}):`,
        ...ctx.deals.map(d => `- ${d.name}: $${(d.mrr/1000).toFixed(1)}K, ${d.stage}, ${d.health}, ${d.probability}% prob, ${d.daysInStage}d in stage`),
        '',
        `RECENT NOTES (${ctx.notes.length}):`,
        ...ctx.notes.slice(-5).map(n => `- [${n.noteType}] ${n.content.substring(0, 200)}`),
        '',
        `RECENT TRANSCRIPTS (${ctx.transcripts.length}):`,
        ...ctx.transcripts.slice(-3).map(t => `- ${t.title}: ${(t.summary || t.content).substring(0, 200)}`),
      ];
      return parts.filter(Boolean).join('\n');
    }

    const [advisors, deals, reps, intentScores] = await Promise.all([
      this.getAdvisors(),
      this.getDeals(),
      this.getReps(),
      this.computeRevenueIntent(),
    ]);

    const totalMRR = advisors.reduce((sum, a) => sum + a.mrr, 0);
    const atRisk = advisors.filter(a => a.trajectory === 'Freefall' || a.trajectory === 'Slipping');
    const stalledDeals = deals.filter(d => d.stage === 'Stalled');
    const hotAdvisors = intentScores.filter(i => i.label === 'Hot');
    const warmAdvisors = intentScores.filter(i => i.label === 'Warm');

    return [
      `PORTFOLIO: ${advisors.length} advisors, $${(totalMRR/1000).toFixed(0)}K total MRR`,
      `AT RISK: ${atRisk.map(a => `${a.name} (${a.trajectory})`).join(', ') || 'None'}`,
      `PIPELINE: ${deals.length} deals, ${stalledDeals.length} stalled`,
      `REVENUE INTENT: ${hotAdvisors.length} Hot, ${warmAdvisors.length} Warm`,
      hotAdvisors.length > 0 ? `HOT ADVISORS: ${hotAdvisors.map(i => `${i.advisorName} (${i.score}/100, ${i.quoteCount30d} quotes 30d)`).join(', ')}` : '',
      `REPS: ${reps.map(r => `${r.name} (${r.partnerCount}/${r.partnerCapacity} capacity, ${r.winRate}% win rate)`).join(', ')}`,
    ].filter(Boolean).join('\n');
  },
};
