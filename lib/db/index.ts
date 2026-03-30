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

// ============ JSON FILE STORE (DEV MODE) ============

const DATA_DIR = path.join(process.cwd(), 'data', 'live');

async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {
    // already exists
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

  // --- Aggregate helpers for signal computation ---
  async getAdvisorContext(advisorId: string) {
    const [advisor, deals, notes, transcripts, activity] = await Promise.all([
      this.getAdvisor(advisorId),
      this.getDeals().then(d => d.filter(deal => deal.advisorId === advisorId)),
      this.getNotes({ advisorId }),
      this.getTranscripts({ advisorId }),
      this.getActivity({ advisorId, limit: 20 }),
    ]);

    return { advisor, deals, notes, transcripts, activity };
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
    const [advisors, deals, reps] = await Promise.all([
      this.getAdvisors(),
      this.getDeals(),
      this.getReps(),
    ]);

    const totalMRR = advisors.reduce((sum, a) => sum + a.mrr, 0);
    const atRisk = advisors.filter(a => a.trajectory === 'Freefall' || a.trajectory === 'Slipping');
    const stalledDeals = deals.filter(d => d.stage === 'Stalled');

    return [
      `PORTFOLIO: ${advisors.length} advisors, $${(totalMRR/1000).toFixed(0)}K total MRR`,
      `AT RISK: ${atRisk.map(a => `${a.name} (${a.trajectory})`).join(', ') || 'None'}`,
      `PIPELINE: ${deals.length} deals, ${stalledDeals.length} stalled`,
      `REPS: ${reps.map(r => `${r.name} (${r.partnerCount}/${r.partnerCapacity} capacity, ${r.winRate}% win rate)`).join(', ')}`,
    ].join('\n');
  },
};
