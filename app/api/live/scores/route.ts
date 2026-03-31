import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  computePulseScore,
  computeDealHealth,
  computeSupplierFriction,
  generateMorningBriefing,
  type ScoringData,
  type PulseScoreResult,
  type DealHealthResult,
  type SupplierFrictionResult,
  type MorningBriefing,
} from '@/lib/scoring';

type ScoringType = 'pulse' | 'dealHealth' | 'friction' | 'briefing' | 'all';

interface ScoresResponse {
  pulse?: PulseScoreResult[];
  dealHealth?: DealHealthResult[];
  friction?: SupplierFrictionResult;
  briefing?: MorningBriefing;
}

/** Helper: gather ScoringData for an advisor */
async function gatherAdvisorScoringData(advisorId: string): Promise<ScoringData | null> {
  const advisor = await db.getAdvisor(advisorId);
  if (!advisor) return null;

  const allDeals = await db.getDeals();
  const advisorDeals = allDeals.filter(d => d.advisorId === advisorId);
  const signals = await db.getSignals({ advisorId });
  const transcripts = await db.getTranscripts({ advisorId });
  const notes = await db.getNotes({ advisorId });
  const activity = await db.getActivity({ advisorId });

  return { advisor, deals: advisorDeals, signals, transcripts, notes, activity };
}

/**
 * GET /api/live/scores
 *
 * Query params:
 * - type: 'pulse' | 'dealHealth' | 'friction' | 'briefing' | 'all' (default: 'all')
 * - advisorId: optional filter
 * - dealId: optional filter (for dealHealth)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = (searchParams.get('type') || 'all') as ScoringType;
    const advisorId = searchParams.get('advisorId') || undefined;
    const dealId = searchParams.get('dealId') || undefined;

    const validTypes = ['pulse', 'dealHealth', 'friction', 'briefing', 'all'];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: `Invalid type. Must be one of: ${validTypes.join(', ')}` }, { status: 400 });
    }

    const response: ScoresResponse = {};

    // ====== PULSE SCORES ======
    if (type === 'pulse' || type === 'all') {
      console.log('[SCORES] Computing pulse scores...');
      const advisors = advisorId
        ? [await db.getAdvisor(advisorId)].filter(Boolean)
        : await db.getAdvisors();

      const pulseResults: PulseScoreResult[] = [];
      for (const advisor of advisors) {
        if (!advisor) continue;
        try {
          const data = await gatherAdvisorScoringData(advisor.id);
          if (!data) continue;
          pulseResults.push(computePulseScore(advisor.id, data));
        } catch (err) {
          console.error(`[SCORES] Error computing pulse for ${advisor.id}:`, err);
        }
      }
      response.pulse = pulseResults;
    }

    // ====== DEAL HEALTH ======
    if (type === 'dealHealth' || type === 'all') {
      console.log('[SCORES] Computing deal health...');
      let deals = dealId
        ? [await db.getDeal(dealId)].filter(Boolean)
        : await db.getDeals();

      if (advisorId) {
        deals = deals.filter(d => d && d.advisorId === advisorId);
      }

      const dealHealthResults: DealHealthResult[] = [];
      for (const deal of deals) {
        if (!deal) continue;
        try {
          const data = await gatherAdvisorScoringData(deal.advisorId);
          if (!data) continue;
          // Override deals with just this one for focused scoring
          data.deals = [deal];
          dealHealthResults.push(computeDealHealth(deal, data));
        } catch (err) {
          console.error(`[SCORES] Error computing health for deal ${deal.id}:`, err);
        }
      }
      response.dealHealth = dealHealthResults;
    }

    // ====== SUPPLIER FRICTION ======
    if (type === 'friction' || type === 'all') {
      console.log('[SCORES] Computing supplier friction...');
      try {
        const transcripts = await db.getTranscripts({});
        const deals = await db.getDeals();
        const signals = await db.getSignals({});
        const activity = await db.getActivity({});
        response.friction = computeSupplierFriction(transcripts, deals, signals, activity);
      } catch (err) {
        console.error('[SCORES] Error computing supplier friction:', err);
      }
    }

    // ====== MORNING BRIEFING ======
    if (type === 'briefing' || type === 'all') {
      console.log('[SCORES] Generating morning briefing...');
      try {
        const advisors = await db.getAdvisors();

        // Compute pulse for all advisors
        const pulseResults: PulseScoreResult[] = [];
        for (const advisor of advisors) {
          try {
            const data = await gatherAdvisorScoringData(advisor.id);
            if (!data) continue;
            pulseResults.push(computePulseScore(advisor.id, data));
          } catch (err) {
            console.error(`[SCORES] Briefing pulse error (${advisor.id}):`, err);
          }
        }

        // Compute deal health for all deals
        const allDeals = await db.getDeals();
        const dealHealthResults: DealHealthResult[] = [];
        for (const deal of allDeals) {
          try {
            const data = await gatherAdvisorScoringData(deal.advisorId);
            if (!data) continue;
            data.deals = [deal];
            dealHealthResults.push(computeDealHealth(deal, data));
          } catch (err) {
            console.error(`[SCORES] Briefing deal health error (${deal.id}):`, err);
          }
        }

        response.briefing = generateMorningBriefing(pulseResults, dealHealthResults, advisors);
      } catch (err) {
        console.error('[SCORES] Error generating morning briefing:', err);
      }
    }

    return NextResponse.json(response);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to compute scores';
    console.error('[API] GET /api/live/scores error:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/live/scores
 *
 * Body: { advisorId: string }
 * Recomputes and persists scoring for a specific advisor.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { advisorId } = body;

    if (!advisorId) {
      return NextResponse.json({ error: 'Missing advisorId in request body' }, { status: 400 });
    }

    console.log(`[SCORES] Recomputing scores for advisor: ${advisorId}`);

    const data = await gatherAdvisorScoringData(advisorId);
    if (!data) {
      return NextResponse.json({ error: 'Advisor not found' }, { status: 404 });
    }

    // Compute pulse score
    const pulseScore = computePulseScore(advisorId, data);

    // Compute deal health for advisor's deals
    const allDeals = await db.getDeals();
    const advisorDeals = allDeals.filter(d => d.advisorId === advisorId);
    const dealHealthResults: DealHealthResult[] = [];
    for (const deal of advisorDeals) {
      try {
        dealHealthResults.push(computeDealHealth(deal, data));
      } catch (err) {
        console.error(`[SCORES] Error computing health for deal ${deal.id}:`, err);
      }
    }

    // Determine overall deal health label
    let overallDealHealth = 'Healthy';
    if (dealHealthResults.length > 0) {
      const avgHealth = dealHealthResults.reduce((sum, d) => sum + d.healthScore, 0) / dealHealthResults.length;
      if (avgHealth >= 70) overallDealHealth = 'Healthy';
      else if (avgHealth >= 40) overallDealHealth = 'Monitor';
      else overallDealHealth = 'At Risk';
    }

    // Map pulse score to tone/intent/friction labels for the advisor record
    const toneLabel = pulseScore.conversationWeighted > 12 ? 'Warm' : pulseScore.conversationWeighted > 6 ? 'Neutral' : 'Cool';
    const intentLabel = pulseScore.dealVelocityWeighted > 10 ? 'Strong' : pulseScore.dealVelocityWeighted > 5 ? 'Moderate' : 'Low';
    const frictionLabel = pulseScore.engagementWeighted < 2 ? 'High' : pulseScore.engagementWeighted < 4 ? 'Moderate' : 'Low';

    // Build diagnosis
    const diagParts: string[] = [];
    diagParts.push(`Pulse: ${pulseScore.pulseState} (${pulseScore.pulseScore}/100)`);
    if (pulseScore.trajectory !== 'Stable') diagParts.push(`Trajectory: ${pulseScore.trajectory}`);
    const atRisk = dealHealthResults.filter(d => d.healthState === 'Stalled / At Risk');
    if (atRisk.length > 0) diagParts.push(`${atRisk.length} deal(s) at risk`);
    if (frictionLabel !== 'Low') diagParts.push(`Friction: ${frictionLabel}`);
    if (intentLabel === 'Low') diagParts.push('Low purchasing intent');
    const diagnosis = diagParts.join(' | ') || 'No significant issues detected';

    // Update advisor record
    const updatedAdvisor = await db.upsertAdvisor({
      ...data.advisor,
      pulse: pulseScore.pulseState,
      trajectory: pulseScore.trajectory,
      tone: toneLabel,
      intent: intentLabel,
      friction: frictionLabel,
      dealHealth: overallDealHealth,
      diagnosis,
    });

    // Log activity
    await db.logActivity({
      advisorId,
      activityType: 'pulse_recomputed',
      description: `Pulse score recomputed: ${pulseScore.pulseState} (${pulseScore.pulseScore}/100)`,
    });

    return NextResponse.json({
      advisor: updatedAdvisor,
      pulseScore,
      dealHealthScores: dealHealthResults,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to recompute scores';
    console.error('[API] POST /api/live/scores error:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
