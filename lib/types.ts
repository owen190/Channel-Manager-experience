export type PulseState = 'Strong' | 'Steady' | 'Rising' | 'Fading' | 'Flatline';
export type Trajectory = 'Accelerating' | 'Climbing' | 'Stable' | 'Slipping' | 'Freefall';
export type Tone = 'Warm' | 'Neutral' | 'Cool';
export type Intent = 'Strong' | 'Moderate' | 'Low';
export type FrictionLevel = 'Low' | 'Moderate' | 'High' | 'Critical';
export type DealHealth = 'Healthy' | 'Monitor' | 'At Risk' | 'Stalled' | 'Slipping' | 'Freefall' | 'Critical';
export type DealStage = 'Discovery' | 'Qualifying' | 'Proposal' | 'Negotiating' | 'Closed Won' | 'Closed Lost' | 'Stalled';
export type PartnerTier = 'anchor' | 'scaling' | 'building' | 'launching';
export type EngagementScore = 'Strong' | 'Steady' | 'Fading';

export interface ActivityItem {
  text: string;
  sentiment: Tone;
  time: string;
  type?: 'call' | 'email' | 'meeting' | 'deal' | 'training';
}

export interface ActionItem {
  id: string;
  text: string;
  daysOld: number;
  assignedTo?: string;
  status: 'pending' | 'overdue' | 'completed';
}

export interface Deal {
  id: string;
  name: string;
  advisorId: string;
  repId?: string;
  mrr: number;
  health: DealHealth;
  stage: DealStage;
  probability: number;
  daysInStage: number;
  closeDate: string;
  actionItems: ActionItem[];
  competitor?: string;
  committed: boolean;
  forecastHistory: number;
  confidenceScore?: 'High' | 'Medium' | 'Low';
  overrideRequested?: boolean;
  overrideApproved?: boolean;
  overrideNote?: string;
  lastModified: string;
}

export interface Advisor {
  id: string;
  name: string;
  title: string;
  company: string;
  pulse: PulseState;
  trajectory: Trajectory;
  tone: Tone;
  intent: Intent;
  friction: FrictionLevel;
  dealHealth: DealHealth;
  tier: PartnerTier;
  mrr: number;
  connectedSince: string;
  bestDayToReach: string;
  commPreference: string;
  referredBy: string;
  location: string;
  birthday: string;
  education: string;
  family: string;
  hobbies: string;
  funFact: string;
  personalIntel: string;
  tsds: string[];
  previousCompanies: string[];
  mutualConnections: string[];
  sharedClients: string[];
  notes: string[];
  activity: ActivityItem[];
  lastContact: string;
  deals: string[];
  engagementBreakdown: {
    engagement: EngagementScore;
    pipelineStrength: EngagementScore;
    responsiveness: EngagementScore;
    growthPotential: EngagementScore;
  };
  diagnosis: string;
}

export interface Rep {
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
  anchor: number;
  scaling: number;
  building: number;
  topConcern: string;
  advisorIds: string[];
  winRate: number;
  avgCycle: number;
  engagementScore: EngagementScore;
  dealsWonQTD: number;
}

export interface Nudge {
  id: string;
  title: string;
  description: string;
  time: string;
  type: 'forecast' | 'capacity' | 'stall' | 'engagement' | 'win' | 'competitive' | 'quarter' | 'override' | 'hygiene';
  priority: 'critical' | 'high' | 'medium';
  linkTo?: string;
}

export interface BriefingItem {
  advisorName: string;
  dealName?: string;
  mrrAtRisk?: number;
  action: string;
  personalHook?: string;
}

export interface FrictionInsight {
  issue: string;
  advisorCount: number;
  advisorNames: string[];
  severity: FrictionLevel;
}

export interface DiagnosticRow {
  advisor: string;
  pulse: PulseState;
  dealHealth: DealHealth;
  friction: FrictionLevel;
  diagnosis: string;
}

export interface StageWeight {
  stage: DealStage;
  weight: number;
}

export interface ForecastHistoryEntry {
  quarter: string;
  target: number;
  actual: number;
  percentage: number;
}

export interface OverrideRequest {
  dealId: string;
  dealName: string;
  repName: string;
  advisorName: string;
  mrr: number;
  reason: string;
  status: 'pending' | 'approved' | 'denied';
  requestDate: string;
}
