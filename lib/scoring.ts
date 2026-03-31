/**
 * Channel Companion - Three-Layer Scoring Engine
 *
 * This module implements the complete scoring architecture:
 * 1. Pulse Score - advisor relationship health (0-100)
 * 2. Deal Health Score - individual deal viability (0-100)
 * 3. Supplier Friction Score - systemic organizational challenges (0-100)
 *
 * Plus sentiment analysis and morning briefing generation.
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type PulseState = 'Strong' | 'Steady' | 'Rising' | 'Fading' | 'Flatline';
type Trajectory = 'Accelerating' | 'Climbing' | 'Stable' | 'Slipping' | 'Freefall';

export interface PulseScoreResult {
  advisorId: string;
  advisorName: string;
  pulseScore: number;
  pulseState: PulseState;
  trajectory: Trajectory;
  previousScore: number | null;

  conversationScore: number;
  crmScore: number;
  dealVelocityScore: number;
  engagementScore: number;

  conversationWeighted: number;
  crmWeighted: number;
  dealVelocityWeighted: number;
  engagementWeighted: number;

  daysSinceLastConversation: number | null;
  conversationCount30d: number;
  activePipelineMRR: number;
  quoteCount30d: number;
  portalLogins30d: number;
}

export interface DealHealthResult {
  dealId: string;
  dealName: string;
  advisorId: string;
  healthScore: number;
  healthState: 'Likely to Close' | 'Needs Intervention' | 'Stalled / At Risk';

  engagementDensity: number;
  intentSignals: number;
  sentimentTrend: number;
  stageVelocity: number;
  riskSignals: number;

  daysInCurrentStage: number;
  stageBenchmarkDays: number;
  riskFactors: string[];
}

export interface SupplierFrictionResult {
  frictionScore: number;
  frictionLevel: 'Low' | 'Moderate' | 'High' | 'Critical';

  pricingResistance: number;
  productConfusion: number;
  competitivePressure: number;
  salesComplexity: number;

  insights: FrictionInsight[];
}

export interface FrictionInsight {
  category: 'pricing' | 'product' | 'competitive' | 'process';
  description: string;
  severity: 'Low' | 'Moderate' | 'High' | 'Critical';
  affectedAdvisors: string[];
  affectedDeals: string[];
}

export interface SentimentAnalysis {
  tone: number;
  intent: number;
  friction: number;
  composite: number;
}

export interface MorningBriefing {
  actNow: BriefingItem[];
  capitalize: BriefingItem[];
  nurture: BriefingItem[];
  generatedAt: string;
}

export interface BriefingItem {
  advisorId: string;
  advisorName: string;
  pulseState: string;
  trajectory: string;
  dealName?: string;
  mrrAtRisk?: number;
  action: string;
  reason: string;
  personalHook?: string;
}

export interface ScoringData {
  advisor: {
    id: string;
    name: string;
    mrr: number;
    pulse?: string;
    trajectory?: string;
    diagnosis?: string;
    [key: string]: any
  };
  deals: Array<{
    id: string;
    name: string;
    advisorId: string;
    mrr: number;
    health: string;
    stage: string;
    probability: number;
    daysInStage: number;
    closeDate?: string;
    competitor?: string;
    committed: boolean;
    actionItems?: any[];
    createdAt?: string;
  }>;
  signals: Array<{
    id: string;
    advisorId: string;
    signalType: string;
    product?: string;
    value?: number;
    notes?: string;
    source?: string;
    occurredAt: string;
  }>;
  transcripts: Array<{
    id: string;
    advisorId?: string;
    content: string;
    sentiment?: string;
    createdAt?: string;
    summary?: string;
    keyMoments?: any[];
  }>;
  notes: Array<{
    id: string;
    advisorId?: string;
    content: string;
    createdAt?: string;
  }>;
  activity: Array<{
    id: string;
    advisorId?: string;
    activityType: string;
    description: string;
    createdAt?: string;
    metadata?: any;
  }>;
  previousPulseScore?: number | null;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Parse ISO date string and return Date object, with fallback
 */
function parseDate(dateStr: string | undefined): Date | null {
  if (!dateStr) return null;
  try {
    return new Date(dateStr);
  } catch {
    return null;
  }
}

/**
 * Calculate days between two dates
 */
function daysBetween(date1: Date, date2: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.floor(Math.abs(date1.getTime() - date2.getTime()) / msPerDay);
}

/**
 * Get days since a specific date from today
 */
function daysSince(dateStr: string | undefined): number | null {
  const date = parseDate(dateStr);
  if (!date) return null;
  return daysBetween(new Date(), date);
}

/**
 * Count keyword occurrences in text (case-insensitive)
 */
function countKeywords(text: string, keywords: string[]): number {
  const lowerText = text.toLowerCase();
  return keywords.reduce((count, keyword) => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    const matches = lowerText.match(regex);
    return count + (matches ? matches.length : 0);
  }, 0);
}

/**
 * Check if text contains any of the keywords
 */
function hasKeyword(text: string, keywords: string[]): boolean {
  return countKeywords(text, keywords) > 0;
}

/**
 * Calculate standard deviation for consistency scoring
 */
function calculateStdDev(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
  const variance = numbers.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / numbers.length;
  return Math.sqrt(variance);
}

/**
 * Determine pulse state from score
 */
function getPulseState(score: number): PulseState {
  if (score >= 85) return 'Strong';
  if (score >= 65) return 'Steady';
  if (score >= 45) return 'Rising';
  if (score >= 25) return 'Fading';
  return 'Flatline';
}

/**
 * Determine trajectory from score change
 */
function getTrajectory(currentScore: number, previousScore: number | null | undefined): Trajectory {
  if (previousScore === null || previousScore === undefined) return 'Stable';

  const change = currentScore - previousScore;

  if (change >= 15) return 'Accelerating';
  if (change >= 5) return 'Climbing';
  if (change >= -4) return 'Stable';
  if (change >= -14) return 'Slipping';
  return 'Freefall';
}

/**
 * Normalize a score to 0-100 range
 */
function normalize(value: number, min: number = 0, max: number = 100): number {
  return Math.max(min, Math.min(max, value));
}

// ============================================================================
// SENTIMENT ANALYSIS
// ============================================================================

export function analyzeSentiment(text: string): SentimentAnalysis {
  const lowerText = text.toLowerCase();

  // Positive tone indicators
  const positiveWords = [
    'appreciate', 'great', 'love', 'excellent', 'thank', 'happy',
    'excited', 'perfect', 'wonderful', 'fantastic', 'awesome',
    'impressed', 'delighted', 'satisfied', 'thrilled'
  ];

  // Negative tone indicators
  const negativeWords = [
    'frustrated', 'disappointed', 'concerned', 'issue', 'problem',
    'difficult', 'worried', 'unhappy', 'confused', 'upset',
    'annoyed', 'stressed', 'troubled', 'challenged'
  ];

  // Buying intent signals
  const intentSignals = [
    'ready', 'move forward', 'contract', 'proposal', 'budget approved',
    'decision', 'timeline', 'pricing', 'sign', 'next steps', 'let\'s do it',
    'send it over', 'go ahead', 'approved', 'confirmed'
  ];

  // Stalling signals
  const stallingSignals = [
    'think about it', 'circle back', 'not right now', 'later', 'maybe',
    'eventually', 'no rush', 'keep in mind', 'in the future', 'hold off',
    'need more time', 'reconsider', 'let me see'
  ];

  // Friction phrases
  const frictionPhrases = [
    'too expensive', 'competitor', 'confusing', 'don\'t understand',
    'taking too long', 'complicated', 'not sure', 'concerned about',
    'hard to', 'issue with', 'problem with', 'worried about',
    'can\'t afford', 'cost is', 'budget concerns', 'price'
  ];

  // Calculate tone (-1 to +1)
  const positiveCount = countKeywords(lowerText, positiveWords);
  const negativeCount = countKeywords(lowerText, negativeWords);
  const toneNet = positiveCount - negativeCount;
  const tone = normalize(toneNet / Math.max(1, positiveCount + negativeCount) || 0, -1, 1);

  // Calculate intent (0 to 1)
  const intentCount = countKeywords(lowerText, intentSignals);
  const stallingCount = countKeywords(lowerText, stallingSignals);
  const intentNet = intentCount - stallingCount;
  const intent = normalize((intentNet + Math.max(intentCount, 1)) / (Math.max(intentCount, stallingCount) * 2), 0, 1);

  // Calculate friction (0 to 1)
  const frictionCount = countKeywords(lowerText, frictionPhrases);
  const friction = normalize(frictionCount / 10, 0, 1);

  // Composite: (0.4 × intent) + (0.3 × (tone + 1) / 2) − (0.3 × friction)
  const composite = (0.4 * intent) + (0.3 * ((tone + 1) / 2)) - (0.3 * friction);

  return {
    tone,
    intent,
    friction,
    composite: normalize(composite, -0.3, 0.7)
  };
}

// ============================================================================
// PULSE SCORE COMPUTATION
// ============================================================================

export function computePulseScore(advisorId: string, data: ScoringData): PulseScoreResult {
  const now = new Date();

  // ========== CONVERSATION INTELLIGENCE (35% weight, max 61 raw pts) ==========

  // Recency of last conversation
  let conversationRecency = 0;
  const lastConversationDays = daysSince(
    data.transcripts.find(t => !t.advisorId || t.advisorId === advisorId)?.createdAt
  );

  if (lastConversationDays !== null) {
    if (lastConversationDays <= 7) conversationRecency = 15;
    else if (lastConversationDays <= 14) conversationRecency = 10;
    else if (lastConversationDays <= 30) conversationRecency = 5;
    else conversationRecency = 0;

    // Decay 2pts/week after day 14
    if (lastConversationDays > 14) {
      const weeksAfter14 = (lastConversationDays - 14) / 7;
      conversationRecency = Math.max(0, conversationRecency - (2 * weeksAfter14));
    }
  }

  // Conversation frequency (30d)
  const convos30d = data.transcripts.filter(t => {
    const days = daysSince(t.createdAt);
    return days !== null && days <= 30;
  }).length;

  let conversationFrequency = 0;
  if (convos30d >= 3) conversationFrequency = 10;
  else if (convos30d === 2) conversationFrequency = 7;
  else if (convos30d === 1) conversationFrequency = 3;

  // Buying intent signals in transcripts/notes
  const intentPhrases = [
    'decision timeline', 'budget approved', 'send a proposal', 'ready to move',
    'contract', 'sign off', 'let\'s do it', 'next steps', 'pricing', 'timeline to close',
    'move forward', 'go ahead', 'approved'
  ];

  let intentCount = 0;
  const recentTranscripts = data.transcripts.filter(t => {
    const days = daysSince(t.createdAt);
    return days !== null && days <= 30;
  });

  recentTranscripts.forEach(t => {
    intentCount += countKeywords(t.content, intentPhrases);
  });

  data.notes.filter(n => {
    const days = daysSince(n.createdAt);
    return days !== null && days <= 30;
  }).forEach(n => {
    intentCount += countKeywords(n.content, intentPhrases);
  });

  const intentSignals = Math.min(15, intentCount * 5);

  // Sentiment trajectory
  let sentimentTrendScore = 0;
  const transcriptsByDate = [...recentTranscripts].sort((a, b) => {
    const dateA = parseDate(a.createdAt) || new Date(0);
    const dateB = parseDate(b.createdAt) || new Date(0);
    return dateB.getTime() - dateA.getTime();
  });

  if (transcriptsByDate.length >= 2) {
    const sentiments = transcriptsByDate.map(t => analyzeSentiment(t.content).composite);
    const recentSentiment = sentiments[0];
    const olderSentiment = sentiments[Math.min(2, sentiments.length - 1)];

    if (recentSentiment > olderSentiment) sentimentTrendScore = 5;
    else if (Math.abs(recentSentiment - olderSentiment) <= 0.1) sentimentTrendScore = 0;
    else sentimentTrendScore = -5;
  }

  // Advisor-initiated contact
  let advisorInitiated = 0;
  const initiatedActivity = data.activity.filter(a => {
    const days = daysSince(a.createdAt);
    return days !== null && days <= 21 && (
      a.activityType === 'inbound_call' ||
      a.activityType === 'inbound_email' ||
      (a.description && a.description.toLowerCase().includes('advisor')) ||
      (a.metadata?.source && String(a.metadata.source).toLowerCase().includes('inbound'))
    );
  });

  advisorInitiated = Math.min(16, initiatedActivity.length * 8);

  const conversationScore = Math.min(61,
    conversationRecency + conversationFrequency + intentSignals + sentimentTrendScore + advisorInitiated
  );

  // ========== CRM ACTIVITY (20% weight, max 35 raw pts) ==========

  // Touch recency
  let touchRecency = 0;
  const lastActivityDays = daysSince(
    data.activity.sort((a, b) =>
      (parseDate(b.createdAt) || new Date(0)).getTime() - (parseDate(a.createdAt) || new Date(0)).getTime()
    )[0]?.createdAt
  );

  if (lastActivityDays !== null) {
    if (lastActivityDays <= 7) touchRecency = 12;
    else if (lastActivityDays <= 14) touchRecency = 8;
    else if (lastActivityDays <= 30) touchRecency = 4;
  }

  // Touch cadence consistency
  const activityDates = data.activity
    .map(a => parseDate(a.createdAt))
    .filter((d): d is Date => d !== null)
    .sort((a, b) => a.getTime() - b.getTime());

  let cadenceScore = 0;
  if (activityDates.length >= 3) {
    const gaps: number[] = [];
    for (let i = 1; i < activityDates.length; i++) {
      gaps.push(daysBetween(activityDates[i], activityDates[i - 1]));
    }
    const stdDev = calculateStdDev(gaps);
    if (stdDev < 5) cadenceScore = 8;
    else if (stdDev < 10) cadenceScore = 4;
  }

  // Email responsiveness (approximated from rapid back-to-back activity)
  let emailResponsiveness = 0;
  for (let i = 1; i < activityDates.length; i++) {
    const gap = daysBetween(activityDates[i], activityDates[i - 1]);
    if (gap <= 1) emailResponsiveness = 6;
    else if (gap <= 3) emailResponsiveness = 3;
  }

  // Meeting completion rate
  const scheduledMeetings = data.activity.filter(a => a.activityType === 'meeting_scheduled').length;
  const completedMeetings = data.activity.filter(a => a.activityType === 'meeting_completed').length;
  let meetingRate = 0;
  if (scheduledMeetings > 0) {
    const rate = completedMeetings / scheduledMeetings;
    if (rate > 0.9) meetingRate = 5;
    else if (rate >= 0.7) meetingRate = 2;
    else meetingRate = -3;
  }

  // Multi-channel engagement
  const channels = new Set<string>();
  data.activity.forEach(a => {
    if (a.activityType.includes('call')) channels.add('call');
    if (a.activityType.includes('email')) channels.add('email');
    if (a.activityType.includes('meeting')) channels.add('meeting');
    if (a.activityType.includes('portal')) channels.add('portal');
  });

  let multiChannel = 0;
  if (channels.size >= 3) multiChannel = 4;
  else if (channels.size === 2) multiChannel = 2;

  const crmScore = Math.min(35,
    touchRecency + cadenceScore + emailResponsiveness + meetingRate + multiChannel
  );

  // ========== DEAL & PIPELINE VELOCITY (30% weight, max 53 raw pts) ==========

  // Active pipeline value (MRR in open deals)
  const openDeals = data.deals.filter(d => d.health && d.health.toLowerCase() !== 'closed won');
  const activePipelineMRR = openDeals.reduce((sum, d) => sum + (d.mrr || 0), 0);

  let pipelineValue = 0;
  if (activePipelineMRR >= 5000) pipelineValue = 15;
  else if (activePipelineMRR >= 2000) pipelineValue = 10;
  else if (activePipelineMRR >= 500) pipelineValue = 5;

  // Deal stage progression
  let stageProgression = 0;
  const recentDeals = data.deals.filter(d => {
    const days = daysSince(d.createdAt);
    return days !== null && days <= 14;
  });
  if (recentDeals.length > 0) stageProgression = 10;
  else {
    const dealsInMonth = data.deals.filter(d => {
      const days = daysSince(d.createdAt);
      return days !== null && days <= 30;
    });
    if (dealsInMonth.length > 0) stageProgression = 5;
  }

  // Stalled deals penalty
  const stalledDeals = data.deals.filter(d => d.daysInStage && d.daysInStage > 30);
  if (stalledDeals.length > 0) stageProgression -= 5;

  // Quote activity
  const quoteSignals = data.signals.filter(s =>
    s.signalType === 'quote_request' && daysSince(s.occurredAt) && daysSince(s.occurredAt)! <= 30
  ).length;

  let quoteActivity = 0;
  if (quoteSignals >= 3) quoteActivity = 8;
  else if (quoteSignals >= 1) quoteActivity = 5;

  // Historical close rate
  const closedDeals = data.deals.filter(d => d.health && d.health.toLowerCase() === 'closed won').length;
  const totalDeals = data.deals.length;
  let closeRate = 0;
  if (totalDeals > 0) {
    const rate = closedDeals / totalDeals;
    if (rate > 0.4) closeRate = 7;
    else if (rate >= 0.2) closeRate = 4;
    else if (rate > 0) closeRate = 1;
  }

  // Revenue trend (MRR growing vs 3 months ago - simplified)
  let revenueTrend = 0;
  const current = activePipelineMRR;
  const baselineEstimate = data.advisor.mrr || 0;
  if (current > baselineEstimate * 1.1) revenueTrend = 8;
  else if (current >= baselineEstimate * 0.9) revenueTrend = 3;
  else revenueTrend = -5;

  // Time-to-close velocity
  const avgDaysInStage = openDeals.length > 0
    ? openDeals.reduce((sum, d) => sum + (d.daysInStage || 0), 0) / openDeals.length
    : 0;

  const benchmark = 21; // average
  let velocityScore = 0;
  if (avgDaysInStage < benchmark * 0.8) velocityScore = 5;
  else if (avgDaysInStage > benchmark * 1.2) velocityScore = -3;

  const dealVelocityScore = Math.min(53,
    pipelineValue + stageProgression + quoteActivity + closeRate + revenueTrend + velocityScore
  );

  // ========== ENGAGEMENT BEHAVIOR (15% weight, max 32 raw pts) ==========

  // Portal activity
  const portalLogins = data.signals.filter(s =>
    s.signalType === 'portal_login' && daysSince(s.occurredAt) && daysSince(s.occurredAt)! <= 30
  ).length;

  let portalActivity = 0;
  if (portalLogins >= 5) portalActivity = 6;
  else if (portalLogins >= 2) portalActivity = 3;
  else if (portalLogins >= 1) portalActivity = 1;

  // Content consumption
  const specDownloads = data.signals.filter(s =>
    s.signalType === 'spec_download' && daysSince(s.occurredAt) && daysSince(s.occurredAt)! <= 30
  ).length;

  let contentConsumption = 0;
  if (specDownloads >= 3) contentConsumption = 5;
  else if (specDownloads >= 1) contentConsumption = 3;

  // Training progress
  const trainingCompleted = data.signals.filter(s =>
    s.signalType === 'training_completed' && daysSince(s.occurredAt) && daysSince(s.occurredAt)! <= 30
  ).length;

  const trainingInPast90 = data.signals.filter(s =>
    s.signalType === 'training_completed' && daysSince(s.occurredAt) && daysSince(s.occurredAt)! <= 90
  ).length;

  let trainingScore = 0;
  if (trainingCompleted > 0) trainingScore = 8;
  else if (trainingInPast90 > 0) trainingScore = 4;

  // Event participation
  const eventSignals = data.signals.filter(s =>
    (s.signalType === 'event' || s.signalType === 'webinar') &&
    daysSince(s.occurredAt) && daysSince(s.occurredAt)! <= 90
  ).length;

  const eventScore = Math.min(10, eventSignals * 5);

  // Marketing email engagement
  const productInquiries = data.signals.filter(s =>
    s.signalType === 'product_inquiry' && daysSince(s.occurredAt) && daysSince(s.occurredAt)! <= 14
  ).length;

  const productInquiries30d = data.signals.filter(s =>
    s.signalType === 'product_inquiry' && daysSince(s.occurredAt) && daysSince(s.occurredAt)! <= 30
  ).length;

  let marketingEngagement = 0;
  if (productInquiries > 0) marketingEngagement = 3;
  else if (productInquiries30d > 0) marketingEngagement = 1;

  const engagementScore = Math.min(32,
    portalActivity + contentConsumption + trainingScore + eventScore + marketingEngagement
  );

  // ========== CALCULATE FINAL PULSE SCORE ==========

  const conversationWeighted = (conversationScore / 61) * 100 * 0.35;
  const crmWeighted = (crmScore / 35) * 100 * 0.20;
  const dealVelocityWeighted = (dealVelocityScore / 53) * 100 * 0.30;
  const engagementWeighted = (engagementScore / 32) * 100 * 0.15;

  const pulseScore = normalize(
    conversationWeighted + crmWeighted + dealVelocityWeighted + engagementWeighted,
    0,
    100
  );

  const pulseState = getPulseState(pulseScore);
  const trajectory = getTrajectory(pulseScore, data.previousPulseScore);

  return {
    advisorId,
    advisorName: data.advisor.name,
    pulseScore: Math.round(pulseScore),
    pulseState,
    trajectory,
    previousScore: data.previousPulseScore || null,

    conversationScore: Math.round(conversationScore),
    crmScore: Math.round(crmScore),
    dealVelocityScore: Math.round(dealVelocityScore),
    engagementScore: Math.round(engagementScore),

    conversationWeighted: Math.round(conversationWeighted),
    crmWeighted: Math.round(crmWeighted),
    dealVelocityWeighted: Math.round(dealVelocityWeighted),
    engagementWeighted: Math.round(engagementWeighted),

    daysSinceLastConversation: lastConversationDays,
    conversationCount30d: convos30d,
    activePipelineMRR: Math.round(activePipelineMRR),
    quoteCount30d: quoteSignals,
    portalLogins30d: portalLogins
  };
}

// ============================================================================
// DEAL HEALTH COMPUTATION
// ============================================================================

export function computeDealHealth(deal: any, data: ScoringData): DealHealthResult {
  // ========== ENGAGEMENT DENSITY (35%) ==========

  const touchesInLast14d = data.activity.filter(a => {
    const days = daysSince(a.createdAt);
    return days !== null && days <= 14;
  }).length;

  let engagementDensity = 0;
  if (touchesInLast14d >= 5) engagementDensity = 100;
  else if (touchesInLast14d >= 2) engagementDensity = 60;
  else if (touchesInLast14d >= 1) engagementDensity = 30;

  // Bonus for multiple stakeholders
  const recentTranscripts = data.transcripts.filter(t => {
    const days = daysSince(t.createdAt);
    return days !== null && days <= 14;
  });

  const stakeholderKeywords = ['stakeholder', 'team', 'committee', 'group', 'multiple', 'each', 'everyone'];
  const hasMultipleStakeholders = recentTranscripts.some(t =>
    hasKeyword(t.content, stakeholderKeywords)
  );

  if (hasMultipleStakeholders) engagementDensity = Math.min(100, engagementDensity + 20);

  // ========== INTENT SIGNALS (25%) ==========

  const intentPhrases = [
    'need this by', 'budget confirmed', 'send the contract', 'ready to move',
    'decision made', 'approved', 'go ahead', 'let\'s move forward'
  ];

  const stallingPhrases = [
    'keep you in mind', 'think about it', 'need more time', 'let me see',
    'circle back', 'not right now', 'maybe later'
  ];

  let highIntentCount = 0;
  recentTranscripts.forEach(t => {
    highIntentCount += countKeywords(t.content, intentPhrases);
  });

  const recentNotes = data.notes.filter(n => {
    const days = daysSince(n.createdAt);
    return days !== null && days <= 30;
  });

  recentNotes.forEach(n => {
    highIntentCount += countKeywords(n.content, intentPhrases);
  });

  const hasNegativeSignals = recentTranscripts.some(t => hasKeyword(t.content, stallingPhrases)) ||
                             recentNotes.some(n => hasKeyword(n.content, stallingPhrases));

  let intentSignals = 0;
  if (highIntentCount >= 3) intentSignals = 100;
  else if (highIntentCount === 2) intentSignals = 75;
  else if (highIntentCount === 1) intentSignals = 50;
  else if (hasNegativeSignals) intentSignals = 25;
  else {
    const hasAnySentiment = recentTranscripts.length > 0;
    intentSignals = hasAnySentiment ? 25 : 0;
  }

  // ========== SENTIMENT TREND (15%) ==========

  let sentimentTrend = 50;
  const sentimentHistory = recentTranscripts
    .map(t => analyzeSentiment(t.content).composite)
    .reverse(); // oldest first

  if (sentimentHistory.length >= 2) {
    const trend = sentimentHistory[sentimentHistory.length - 1] - sentimentHistory[0];
    if (trend > 0.2) sentimentTrend = 100;
    else if (trend > 0) sentimentTrend = 75;
    else if (trend >= -0.1) sentimentTrend = 50;
    else if (trend >= -0.3) sentimentTrend = 25;
    else sentimentTrend = 0;
  } else if (sentimentHistory.length === 1) {
    const sentiment = sentimentHistory[0];
    if (sentiment > 0.3) sentimentTrend = 75;
    else if (sentiment <= -0.2) sentimentTrend = 25;
  }

  // ========== STAGE VELOCITY (15%) ==========

  const benchmarks: { [key: string]: number } = {
    discovery: 14,
    qualifying: 21,
    proposal: 14,
    negotiating: 14,
    default: 21
  };

  const stageBenchmark = benchmarks[deal.stage?.toLowerCase()] || benchmarks.default;
  const daysInStage = deal.daysInStage || 0;

  let stageVelocity = 0;
  if (daysInStage <= stageBenchmark) stageVelocity = 100;
  else if (daysInStage <= stageBenchmark * 1.5) stageVelocity = 60;
  else if (daysInStage <= stageBenchmark * 2) stageVelocity = 30;
  else stageVelocity = 0;

  // ========== RISK SIGNALS (10%, inverted) ==========

  let riskSignals = 100;

  // Competitor mentioned
  if (deal.competitor || hasKeyword(
    recentTranscripts.map(t => t.content).join(' ') +
    recentNotes.map(n => n.content).join(' '),
    ['competitor', 'alternative', 'competing']
  )) {
    riskSignals -= 25;
  }

  // Pricing objections
  if (hasKeyword(
    recentTranscripts.map(t => t.content).join(' ') +
    recentNotes.map(n => n.content).join(' '),
    ['too expensive', 'price', 'cost', 'budget', 'can\'t afford', 'cheaper']
  )) {
    riskSignals -= 25;
  }

  // Deal stalled
  if (daysInStage > 30) {
    riskSignals -= 25;
  }

  // Single-threaded (no multi-stakeholder signals)
  if (!hasMultipleStakeholders) {
    riskSignals -= 15;
  }

  riskSignals = Math.max(0, riskSignals);

  // ========== CALCULATE FINAL DEAL HEALTH ==========

  const healthScore = normalize(
    (engagementDensity * 0.35) +
    (intentSignals * 0.25) +
    (sentimentTrend * 0.15) +
    (stageVelocity * 0.15) +
    (riskSignals * 0.10),
    0,
    100
  );

  let healthState: 'Likely to Close' | 'Needs Intervention' | 'Stalled / At Risk';
  if (healthScore >= 70) healthState = 'Likely to Close';
  else if (healthScore >= 40) healthState = 'Needs Intervention';
  else healthState = 'Stalled / At Risk';

  // Build risk factors
  const riskFactors: string[] = [];
  if (deal.competitor) riskFactors.push(`Competing with ${deal.competitor}`);
  if (daysInStage > stageBenchmark) riskFactors.push(`Stalled in ${deal.stage} (${daysInStage} days vs ${stageBenchmark} benchmark)`);
  if (!hasMultipleStakeholders) riskFactors.push('Single-threaded relationship');
  if (touchesInLast14d === 0) riskFactors.push('No recent activity');
  if (hasKeyword(
    recentTranscripts.map(t => t.content).join(' '),
    ['concern', 'issue', 'problem', 'worried']
  )) {
    riskFactors.push('Concerns expressed in recent conversation');
  }

  return {
    dealId: deal.id,
    dealName: deal.name,
    advisorId: deal.advisorId,
    healthScore: Math.round(healthScore),
    healthState,

    engagementDensity: Math.round(engagementDensity),
    intentSignals: Math.round(intentSignals),
    sentimentTrend: Math.round(sentimentTrend),
    stageVelocity: Math.round(stageVelocity),
    riskSignals: Math.round(riskSignals),

    daysInCurrentStage: daysInStage,
    stageBenchmarkDays: stageBenchmark,
    riskFactors
  };
}

// ============================================================================
// SUPPLIER FRICTION COMPUTATION
// ============================================================================

export function computeSupplierFriction(
  allTranscripts: any[],
  allDeals: any[],
  allSignals: any[],
  allActivity: any[]
): SupplierFrictionResult {
  const allText = allTranscripts.map(t => t.content || '').join('\n') + '\n' +
                  allDeals.map(d => d.competitor || '').join('\n');

  // ========== PRICING RESISTANCE (30%) ==========

  const pricingPhrases = [
    'too expensive', 'competitor is cheaper', 'can\'t justify the cost',
    'budget concerns', 'price point', 'cost is', 'expensive', 'cheap',
    'discount', 'negotiable', 'can\'t afford'
  ];

  const pricingMentions = countKeywords(allText, pricingPhrases);
  let pricingResistance = 0;
  if (pricingMentions === 0) pricingResistance = 0;
  else if (pricingMentions <= 3) pricingResistance = 25;
  else if (pricingMentions <= 6) pricingResistance = 50;
  else if (pricingMentions <= 10) pricingResistance = 75;
  else pricingResistance = 100;

  // ========== PRODUCT CONFUSION (25%) ==========

  const confusionPhrases = [
    'don\'t understand', 'not sure how', 'does it do', 'confusing', 'hard to explain',
    'complicated', 'unclear', 'what does it', 'how does', 'not sure what',
    'lost me', 'don\'t get'
  ];

  const confusionMentions = countKeywords(allText, confusionPhrases);
  let productConfusion = 0;
  if (confusionMentions === 0) productConfusion = 0;
  else if (confusionMentions <= 3) productConfusion = 25;
  else if (confusionMentions <= 6) productConfusion = 50;
  else if (confusionMentions <= 10) productConfusion = 75;
  else productConfusion = 100;

  // ========== COMPETITIVE PRESSURE (25%) ==========

  const competitorPhrases = [
    'competitor', 'alternative', 'competing', 'instead of', 'vs ', ' or ',
    'comparing', 'versus', 'another solution'
  ];

  let competitorMentions = countKeywords(allText, competitorPhrases);
  competitorMentions += allDeals.filter(d => d.competitor).length;

  let competitivePressure = 0;
  if (competitorMentions === 0) competitivePressure = 0;
  else if (competitorMentions <= 3) competitivePressure = 25;
  else if (competitorMentions <= 6) competitivePressure = 50;
  else if (competitorMentions <= 10) competitivePressure = 75;
  else competitivePressure = 100;

  // ========== SALES COMPLEXITY (20%) ==========

  const complexityPhrases = [
    'still waiting', 'how long', 'when can i', 'taking too long',
    'process is slow', 'so many steps', 'bureaucracy', 'approval',
    'stakeholders', 'committee', 'takes forever'
  ];

  const complexityMentions = countKeywords(allText, complexityPhrases);

  // Also check average days in stage
  const avgDaysInStage = allDeals.length > 0
    ? allDeals.reduce((sum, d) => sum + (d.daysInStage || 0), 0) / allDeals.length
    : 0;

  const benchmarkDays = 21;
  let slowVelocity = 0;
  if (avgDaysInStage > benchmarkDays * 1.5) slowVelocity = 50;
  else if (avgDaysInStage > benchmarkDays) slowVelocity = 25;

  let salesComplexity = Math.max(slowVelocity, 0);
  if (complexityMentions === 0) salesComplexity = Math.max(salesComplexity, 0);
  else if (complexityMentions <= 3) salesComplexity = Math.max(salesComplexity, 25);
  else if (complexityMentions <= 6) salesComplexity = Math.max(salesComplexity, 50);
  else if (complexityMentions <= 10) salesComplexity = Math.max(salesComplexity, 75);
  else salesComplexity = 100;

  // ========== CALCULATE FRICTION SCORE ==========

  const frictionScore = normalize(
    (pricingResistance * 0.30) +
    (productConfusion * 0.25) +
    (competitivePressure * 0.25) +
    (salesComplexity * 0.20),
    0,
    100
  );

  let frictionLevel: 'Low' | 'Moderate' | 'High' | 'Critical';
  if (frictionScore <= 20) frictionLevel = 'Low';
  else if (frictionScore <= 45) frictionLevel = 'Moderate';
  else if (frictionScore <= 70) frictionLevel = 'High';
  else frictionLevel = 'Critical';

  // ========== BUILD INSIGHTS ==========

  const insights: FrictionInsight[] = [];

  if (pricingResistance > 40) {
    const affectedAdvisors = new Set<string>();
    const affectedDeals = new Set<string>();

    allTranscripts.forEach(t => {
      if (hasKeyword(t.content, pricingPhrases)) {
        if (t.advisorId) affectedAdvisors.add(t.advisorId);
      }
    });

    insights.push({
      category: 'pricing',
      description: `Pricing resistance detected (${pricingMentions} mentions). Customers expressing concerns about cost justification and budget constraints.`,
      severity: pricingMentions > 8 ? 'High' : 'Moderate',
      affectedAdvisors: Array.from(affectedAdvisors),
      affectedDeals: Array.from(affectedDeals)
    });
  }

  if (productConfusion > 40) {
    insights.push({
      category: 'product',
      description: `Product clarity issues (${confusionMentions} mentions). Advisors struggling to articulate product value and features.`,
      severity: confusionMentions > 8 ? 'High' : 'Moderate',
      affectedAdvisors: [],
      affectedDeals: []
    });
  }

  if (competitivePressure > 40) {
    insights.push({
      category: 'competitive',
      description: `High competitive pressure (${competitorMentions} mentions). Multiple alternatives being considered by prospects.`,
      severity: competitorMentions > 8 ? 'High' : 'Moderate',
      affectedAdvisors: [],
      affectedDeals: allDeals.filter(d => d.competitor).map(d => d.name)
    });
  }

  if (salesComplexity > 40) {
    insights.push({
      category: 'process',
      description: `Sales cycle complexity (${complexityMentions} complaints). Deals taking ${Math.round(avgDaysInStage)} days vs ${benchmarkDays} benchmark. Process-related delays frustrating stakeholders.`,
      severity: avgDaysInStage > benchmarkDays * 2 ? 'High' : 'Moderate',
      affectedAdvisors: [],
      affectedDeals: allDeals.filter(d => d.daysInStage > benchmarkDays * 1.5).map(d => d.name)
    });
  }

  return {
    frictionScore: Math.round(frictionScore),
    frictionLevel,
    pricingResistance: Math.round(pricingResistance),
    productConfusion: Math.round(productConfusion),
    competitivePressure: Math.round(competitivePressure),
    salesComplexity: Math.round(salesComplexity),
    insights
  };
}

// ============================================================================
// SCORE DECAY
// ============================================================================

export function computeScoreDecay(
  currentScore: number,
  daysSinceLastSignal: number,
  type: 'pulse' | 'dealHealth' | 'friction'
): number {
  if (type === 'friction') {
    return currentScore; // Friction doesn't decay
  }

  const decayRate = type === 'pulse' ? 3 : 5; // points per week
  const weeks = daysSinceLastSignal / 7;
  const decayAmount = weeks * decayRate;

  return Math.max(0, currentScore - decayAmount);
}

// ============================================================================
// MORNING BRIEFING GENERATION
// ============================================================================

export function generateMorningBriefing(
  pulseResults: PulseScoreResult[],
  dealHealthResults: DealHealthResult[],
  advisors: any[]
): MorningBriefing {
  const actNow: BriefingItem[] = [];
  const capitalize: BriefingItem[] = [];
  const nurture: BriefingItem[] = [];

  pulseResults.forEach(pulse => {
    // ACT NOW: Freefall or Fading with stalled deals
    if (pulse.trajectory === 'Freefall' ||
        (pulse.pulseState === 'Fading' && pulse.trajectory === 'Slipping')) {
      const atRiskDeal = dealHealthResults.find(d =>
        d.advisorId === pulse.advisorId &&
        d.healthState === 'Stalled / At Risk'
      );

      actNow.push({
        advisorId: pulse.advisorId,
        advisorName: pulse.advisorName,
        pulseState: pulse.pulseState,
        trajectory: pulse.trajectory,
        dealName: atRiskDeal?.dealName,
        mrrAtRisk: atRiskDeal?.dealId ?
          dealHealthResults.find(d => d.dealId === atRiskDeal.dealId)?.dealId ? 5000 : 0 : 0,
        action: 'Schedule immediate check-in',
        reason: `Relationship ${pulse.trajectory === 'Freefall' ? 'in freefall' : 'declining'} with ${atRiskDeal ? 'deal at risk' : 'no recent activity'}`,
        personalHook: `Last conversation ${pulse.daysSinceLastConversation} days ago`
      });
    }

    // ACT NOW: Stalled deals
    const stalledDeal = dealHealthResults.find(d =>
      d.advisorId === pulse.advisorId &&
      d.healthState === 'Stalled / At Risk'
    );

    if (stalledDeal && !actNow.find(b => b.advisorId === pulse.advisorId)) {
      actNow.push({
        advisorId: pulse.advisorId,
        advisorName: pulse.advisorName,
        pulseState: pulse.pulseState,
        trajectory: pulse.trajectory,
        dealName: stalledDeal.dealName,
        mrrAtRisk: 0, // placeholder
        action: 'Intervene on stalled deal',
        reason: `${stalledDeal.dealName} stalled for ${stalledDeal.daysInCurrentStage} days`,
        personalHook: `Last touch ${pulse.daysSinceLastConversation} days ago`
      });
    }

    // CAPITALIZE: Rising or Strong with cross-sell signals
    if (pulse.pulseState === 'Rising' || (pulse.pulseState === 'Strong' && pulse.trajectory === 'Climbing')) {
      const trainingCompleted = dealHealthResults.find(d =>
        d.advisorId === pulse.advisorId
      )?.riskFactors.some(r => r.includes('training'));

      if (pulse.conversationCount30d > 0 || trainingCompleted) {
        capitalize.push({
          advisorId: pulse.advisorId,
          advisorName: pulse.advisorName,
          pulseState: pulse.pulseState,
          trajectory: pulse.trajectory,
          action: 'Explore cross-sell or upsell',
          reason: `Strong engagement momentum, open to conversations`,
          personalHook: `${pulse.conversationCount30d} conversations in last 30 days`
        });
      }
    }

    // NURTURE: Steady or Strong on track
    if ((pulse.pulseState === 'Steady' || pulse.pulseState === 'Strong') &&
        pulse.trajectory === 'Stable' &&
        pulse.daysSinceLastConversation && pulse.daysSinceLastConversation > 10) {
      nurture.push({
        advisorId: pulse.advisorId,
        advisorName: pulse.advisorName,
        pulseState: pulse.pulseState,
        trajectory: pulse.trajectory,
        action: 'Schedule friendly check-in',
        reason: 'Healthy relationship but due for touch',
        personalHook: `Last conversation ${pulse.daysSinceLastConversation} days ago`
      });
    }
  });

  return {
    actNow,
    capitalize,
    nurture,
    generatedAt: new Date().toISOString()
  };
}
