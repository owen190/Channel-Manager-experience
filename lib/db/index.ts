/**
 * Database abstraction layer for Channel Companion Live
 *
 * DEV MODE: reads/writes JSON files in /data directory
 * PROD MODE: connects to Railway Postgres via DATABASE_URL
 *
 * Josh: To switch to Postgres, set DATABASE_URL in Railway env vars
 * and update this file to use the postgres client instead of JSON.
 * The API routes don't change — only this file does.
 */

import { promises as fs } from 'fs';
import path from 'path';

// Types matching the schema
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

// ============ ENGAGEMENT SIGNALS ============

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
  product?: string;       // e.g. "SD-WAN", "UCaaS", "Managed Security"
  value?: number;          // estimated deal value if known
  notes?: string;
  source?: string;         // "CRM", "Portal", "Email", "Manual"
  occurredAt: string;      // when the signal happened (not when logged)
  createdAt?: string;
}

export interface RevenueIntent {
  advisorId: string;
  advisorName: string;
  score: number;            // 0-100
  label: 'Hot' | 'Warm' | 'Interested' | 'Cold';
  signals30d: number;       // count in last 30 days
  signals90d: number;       // count in last 90 days
  lastSignalDate: string;
  topProducts: string[];
  quoteCount30d: number;
  totalEstimatedValue: number;
}

// ============ JSON FILE STORE (DEV MODE) ============

// Use /tmp on Railway (writable) or data/live locally
function getDataDir(): string {
  // If LIVE_DATA_DIR is set, use it
  if (process.env.LIVE_DATA_DIR) return process.env.LIVE_DATA_DIR;
  // On Railway or production, use /tmp (guaranteed writable)
  if (process.env.RAILWAY_ENVIRONMENT || process.env.NODE_ENV === 'production') {
    return '/tmp/channel-companion-live';
  }
  // Local dev: use project directory
  return path.join(process.cwd(), 'data', 'live');
}

const DATA_DIR = getDataDir();
let dataDirReady = false;

async function ensureDataDir() {
  if (dataDirReady) return;
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    dataDirReady = true;
    console.log(`[DB] Data directory ready: ${DATA_DIR}`);
  } catch (err) {
    console.error(`[DB] Failed to create data directory ${DATA_DIR}:`, err);
    throw new Error(`Cannot create data directory: ${DATA_DIR}`);
  }
}

async function readCollection<T>(name: string): Promise<T[]> {
  await ensureDataDir();
  const filePath = path.join(DATA_DIR, `${name}.json`);
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeCollection<T>(name: string, data: T[]): Promise<void> {
  await ensureDataDir();
  const filePath = path.join(DATA_DIR, `${name}.json`);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  console.log(`[DB] Wrote ${data.length} items to ${name}.json`);
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// ============ DATABASE OPERATIONS ============

export const db = {
  // --- Advisors ---
  async getAdvisors(): Promise<LiveAdvisor[]> {
    return readCollection<LiveAdvisor>('advisors');
  },

  async getAdvisor(id: string): Promise<LiveAdvisor | null> {
    const advisors = await this.getAdvisors();
    return advisors.find(a => a.id === id) || null;
  },

  async upsertAdvisor(advisor: Partial<LiveAdvisor> & { id?: string }): Promise<LiveAdvisor> {
    const advisors = await this.getAdvisors();
    const now = new Date().toISOString();
    const id = advisor.id || generateId();
    const existing = advisors.findIndex(a => a.id === id);

    const record: LiveAdvisor = {
      id,
      name: advisor.name || '',
      title: advisor.title || '',
      company: advisor.company || '',
      mrr: advisor.mrr || 0,
      pulse: advisor.pulse || 'Steady',
      trajectory: advisor.trajectory || 'Stable',
      tone: advisor.tone || 'Neutral',
      intent: advisor.intent || 'Moderate',
      friction: advisor.friction || 'Low',
      dealHealth: advisor.dealHealth || 'Healthy',
      tier: advisor.tier || 'other',
      ...advisor,
      updatedAt: now,
      createdAt: existing >= 0 ? advisors[existing].createdAt : now,
    };

    if (existing >= 0) {
      advisors[existing] = record;
    } else {
      advisors.push(record);
    }
    await writeCollection('advisors', advisors);
    return record;
  },

  async deleteAdvisor(id: string): Promise<boolean> {
    const advisors = await this.getAdvisors();
    const filtered = advisors.filter(a => a.id !== id);
    if (filtered.length === advisors.length) return false;
    await writeCollection('advisors', filtered);
    return true;
  },

  // --- Reps ---
  async getReps(): Promise<LiveRep[]> {
    return readCollection<LiveRep>('reps');
  },

  async getRep(id: string): Promise<LiveRep | null> {
    const reps = await this.getReps();
    return reps.find(r => r.id === id) || null;
  },

  async upsertRep(rep: Partial<LiveRep> & { id?: string }): Promise<LiveRep> {
    const reps = await this.getReps();
    const now = new Date().toISOString();
    const id = rep.id || generateId();
    const existing = reps.findIndex(r => r.id === id);

    const record: LiveRep = {
      id,
      name: rep.name || '',
      title: rep.title || '',
      managedMRR: rep.managedMRR || 0,
      activeDeals: rep.activeDeals || 0,
      quotaTarget: rep.quotaTarget || 0,
      closedWon: rep.closedWon || 0,
      commitTarget: rep.commitTarget || 0,
      currentCommit: rep.currentCommit || 0,
      partnerCount: rep.partnerCount || 0,
      partnerCapacity: rep.partnerCapacity || 30,
      top10: rep.top10 || 0,
      next20: rep.next20 || 0,
      other: rep.other || 0,
      winRate: rep.winRate || 0,
      avgCycle: rep.avgCycle || 0,
      engagementScore: rep.engagementScore || 'Steady',
      dealsWonQTD: rep.dealsWonQTD || 0,
      ...rep,
      updatedAt: now,
      createdAt: existing >= 0 ? reps[existing].createdAt : now,
    };

    if (existing >= 0) {
      reps[existing] = record;
    } else {
      reps.push(record);
    }
    await writeCollection('reps', reps);
    return record;
  },

  // --- Deals ---
  async getDeals(): Promise<LiveDeal[]> {
    return readCollection<LiveDeal>('deals');
  },

  async getDeal(id: string): Promise<LiveDeal | null> {
    const deals = await this.getDeals();
    return deals.find(d => d.id === id) || null;
  },

  async upsertDeal(deal: Partial<LiveDeal> & { id?: string }): Promise<LiveDeal> {
    const deals = await this.getDeals();
    const now = new Date().toISOString();
    const id = deal.id || generateId();
    const existing = deals.findIndex(d => d.id === id);

    const record: LiveDeal = {
      id,
      name: deal.name || '',
      advisorId: deal.advisorId || '',
      repId: deal.repId || '',
      mrr: deal.mrr || 0,
      health: deal.health || 'Healthy',
      stage: deal.stage || 'Discovery',
      probability: deal.probability || 0,
      daysInStage: deal.daysInStage || 0,
      committed: deal.committed || false,
      forecastHistory: deal.forecastHistory || 0,
      overrideRequested: deal.overrideRequested || false,
      ...deal,
      updatedAt: now,
      createdAt: existing >= 0 ? deals[existing].createdAt : now,
    };

    if (existing >= 0) {
      deals[existing] = record;
    } else {
      deals.push(record);
    }
    await writeCollection('deals', deals);
    return record;
  },

  // --- Notes ---
  async getNotes(filters?: { advisorId?: string; dealId?: string }): Promise<LiveNote[]> {
    const notes = await readCollection<LiveNote>('notes');
    if (!filters) return notes;
    return notes.filter(n => {
      if (filters.advisorId && n.advisorId !== filters.advisorId) return false;
      if (filters.dealId && n.dealId !== filters.dealId) return false;
      return true;
    });
  },

  async createNote(note: Omit<LiveNote, 'id' | 'createdAt' | 'updatedAt'>): Promise<LiveNote> {
    const notes = await this.getNotes();
    const now = new Date().toISOString();
    const record: LiveNote = {
      ...note,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };
    notes.push(record);
    await writeCollection('notes', notes);
    return record;
  },

  // --- Transcripts ---
  async getTranscripts(filters?: { advisorId?: string }): Promise<LiveTranscript[]> {
    const transcripts = await readCollection<LiveTranscript>('transcripts');
    if (!filters) return transcripts;
    return transcripts.filter(t => {
      if (filters.advisorId && t.advisorId !== filters.advisorId) return false;
      return true;
    });
  },

  async createTranscript(transcript: Omit<LiveTranscript, 'id' | 'createdAt'>): Promise<LiveTranscript> {
    const transcripts = await this.getTranscripts();
    const now = new Date().toISOString();
    const record: LiveTranscript = {
      ...transcript,
      id: generateId(),
      createdAt: now,
    };
    transcripts.push(record);
    await writeCollection('transcripts', transcripts);
    return record;
  },

  // --- Activity Log ---
  async getActivity(filters?: { advisorId?: string; limit?: number }): Promise<LiveActivity[]> {
    let activity = await readCollection<LiveActivity>('activity');
    if (filters?.advisorId) {
      activity = activity.filter(a => a.advisorId === filters.advisorId);
    }
    activity.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    if (filters?.limit) {
      activity = activity.slice(0, filters.limit);
    }
    return activity;
  },

  async logActivity(activity: Omit<LiveActivity, 'id' | 'createdAt'>): Promise<LiveActivity> {
    const activities = await readCollection<LiveActivity>('activity');
    const record: LiveActivity = {
      ...activity,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    activities.push(record);
    await writeCollection('activity', activities);
    return record;
  },

  // --- Engagement Signals ---
  async getSignals(filters?: { advisorId?: string; signalType?: SignalType; since?: string }): Promise<EngagementSignal[]> {
    let signals = await readCollection<EngagementSignal>('signals');
    if (filters?.advisorId) signals = signals.filter(s => s.advisorId === filters.advisorId);
    if (filters?.signalType) signals = signals.filter(s => s.signalType === filters.signalType);
    if (filters?.since) {
      const sinceDate = new Date(filters.since).getTime();
      signals = signals.filter(s => new Date(s.occurredAt).getTime() >= sinceDate);
    }
    signals.sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());
    return signals;
  },

  async createSignal(signal: Omit<EngagementSignal, 'id' | 'createdAt'>): Promise<EngagementSignal> {
    const signals = await readCollection<EngagementSignal>('signals');
    const record: EngagementSignal = {
      ...signal,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    signals.push(record);
    await writeCollection('signals', signals);
    return record;
  },

  async bulkCreateSignals(newSignals: Omit<EngagementSignal, 'id' | 'createdAt'>[]): Promise<number> {
    const signals = await readCollection<EngagementSignal>('signals');
    const now = new Date().toISOString();
    const records = newSignals.map(s => ({
      ...s,
      id: generateId(),
      createdAt: now,
    }));
    signals.push(...records);
    await writeCollection('signals', signals);
    return records.length;
  },

  async deleteSignal(id: string): Promise<boolean> {
    const signals = await readCollection<EngagementSignal>('signals');
    const filtered = signals.filter(s => s.id !== id);
    if (filtered.length === signals.length) return false;
    await writeCollection('signals', filtered);
    return true;
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

    // Signal weights: quotes and pricing are strongest buying signals
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

      // Weighted score: recent signals count more
      let rawScore = 0;
      for (const s of signals30d) {
        rawScore += (WEIGHTS[s.signalType] || 5) * 1.5; // 1.5x recency boost for 30d
      }
      for (const s of signals90d.filter(s => now - new Date(s.occurredAt).getTime() >= d30)) {
        rawScore += WEIGHTS[s.signalType] || 5;
      }
      // Normalize to 0-100
      const score = Math.min(100, Math.round(rawScore));

      // Label
      const label: RevenueIntent['label'] =
        score >= 70 ? 'Hot' : score >= 40 ? 'Warm' : score >= 15 ? 'Interested' : 'Cold';

      // Top products by frequency
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

  // --- Aggregate helpers for signal computation ---
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

  // Build full context string for Claude AI
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

    // General portfolio context
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
