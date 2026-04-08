/**
 * Adapts Live database types to the static demo types used by shared components.
 * This lets the live dashboards reuse AdvisorTable, AdvisorPanel, KPICard, badges, etc.
 */

import type { Advisor, Deal, Rep, EngagementScore, PulseState, Trajectory, Tone, Intent, FrictionLevel, DealHealth, DealStage, PartnerTier } from '@/lib/types';
import type { LiveAdvisor, LiveDeal, LiveRep } from './index';

export function adaptAdvisor(live: LiveAdvisor): Advisor {
  return {
    id: live.id,
    name: live.name,
    title: live.title,
    company: live.company,
    mrr: live.mrr,
    pulse: (live.pulse || 'Steady') as PulseState,
    trajectory: (live.trajectory || 'Stable') as Trajectory,
    tone: (live.tone || 'Neutral') as Tone,
    intent: (live.intent || 'Moderate') as Intent,
    friction: (live.friction || 'Low') as FrictionLevel,
    dealHealth: (live.dealHealth || 'Healthy') as DealHealth,
    tier: ({ top10: 'anchor', next20: 'scaling', other: 'building', anchor: 'anchor', scaling: 'scaling', building: 'building', launching: 'launching', platinum: 'anchor', gold: 'scaling', silver: 'building', onboarding: 'launching' }[live.tier || 'building'] || 'building') as PartnerTier,
    connectedSince: live.connectedSince || '2025-01-01',
    bestDayToReach: live.bestDayToReach || 'Tuesday',
    commPreference: live.commPreference || 'Email',
    referredBy: live.referredBy || '',
    location: live.location || '',
    birthday: live.birthday || '',
    education: live.education || '',
    family: live.family || '',
    hobbies: live.hobbies || '',
    funFact: live.funFact || '',
    personalIntel: live.personalIntel || '',
    diagnosis: live.diagnosis || '',
    tsds: live.tsds || [],
    previousCompanies: live.previousCompanies || [],
    mutualConnections: live.mutualConnections || [],
    sharedClients: live.sharedClients || [],
    engagementBreakdown: live.engagementBreakdown
      ? {
          engagement: (live.engagementBreakdown.engagement || 'Steady') as unknown as EngagementScore,
          pipelineStrength: (live.engagementBreakdown.pipelineStrength || 'Steady') as unknown as EngagementScore,
          responsiveness: (live.engagementBreakdown.responsiveness || 'Steady') as unknown as EngagementScore,
          growthPotential: (live.engagementBreakdown.growthPotential || 'Steady') as unknown as EngagementScore,
        }
      : { engagement: 'Steady' as EngagementScore, pipelineStrength: 'Steady' as EngagementScore, responsiveness: 'Steady' as EngagementScore, growthPotential: 'Steady' as EngagementScore },
    notes: [],
    activity: [],
    lastContact: live.updatedAt || new Date().toISOString(),
    deals: [],
  };
}

export function adaptDeal(live: LiveDeal): Deal {
  return {
    id: live.id,
    name: live.name,
    advisorId: live.advisorId,
    repId: live.repId,
    mrr: live.mrr,
    health: (live.health || 'Healthy') as DealHealth,
    stage: (live.stage || 'Discovery') as DealStage,
    probability: live.probability,
    daysInStage: live.daysInStage,
    closeDate: live.closeDate || '',
    actionItems: (live.actionItems || []) as Deal['actionItems'],
    competitor: live.competitor,
    committed: live.committed,
    forecastHistory: live.forecastHistory,
    confidenceScore: (live.confidenceScore as 'High' | 'Medium' | 'Low') || undefined,
    overrideRequested: live.overrideRequested,
    overrideApproved: live.overrideApproved,
    overrideNote: live.overrideNote,
    lastModified: live.lastModified || live.updatedAt || new Date().toISOString(),
  };
}

export function adaptRep(live: LiveRep): Rep {
  return {
    id: live.id,
    name: live.name,
    title: live.title,
    managedMRR: live.managedMRR,
    activeDeals: live.activeDeals,
    quotaTarget: live.quotaTarget,
    closedWon: live.closedWon,
    commitTarget: live.commitTarget,
    currentCommit: live.currentCommit,
    partnerCount: live.partnerCount,
    partnerCapacity: live.partnerCapacity,
    anchor: live.anchor,
    scaling: live.scaling,
    building: live.building,
    topConcern: live.topConcern || '',
    advisorIds: [],
    winRate: live.winRate,
    avgCycle: live.avgCycle,
    engagementScore: (live.engagementScore || 'Steady') as EngagementScore,
    dealsWonQTD: live.dealsWonQTD,
  };
}
