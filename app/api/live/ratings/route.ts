import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const advisors = await db.getAdvisors();

    // Generate deterministic mock ratings based on advisor friction levels
    // This simulates consuming data from The Channel Standard ratings platform
    const seededRandom = (seed: string): number => {
      let hash = 0;
      for (let i = 0; i < seed.length; i++) {
        const char = seed.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      return Math.abs(hash) % 1000 / 1000;
    };

    // Simulate supplier data from The Channel Standard
    const supplierData = {
      supplier: {
        id: 'aptum-001',
        name: 'Aptum',
        overallScore: 72,
        responseCount: 24,
        metrics: {
          onboardingAccuracy: {
            score: 78,
            promised: '5 days',
            actual: '6.2 days',
            trend: 'stable' as const,
          },
          supportResponseTime: {
            score: 65,
            slaTarget: '4 hours',
            actual: '5.8 hours',
            trend: 'down' as const,
          },
          commissionAccuracy: {
            score: 81,
            disputeRate: '2.1%',
            trend: 'up' as const,
          },
          coMarketingFollowThrough: {
            score: 68,
            completionRate: '73%',
            trend: 'stable' as const,
          },
          technicalExpertise: {
            score: 75,
            trend: 'up' as const,
          },
          dealRegistrationSpeed: {
            score: 70,
            avgDays: '3.2 days',
            trend: 'stable' as const,
          },
        },
        recentFeedback: [
          {
            advisorAnonymized: 'Advisor A',
            metric: 'Commission Accuracy',
            comment: 'They fixed the payment disputes quickly this quarter',
            date: '2026-03-28',
            sentiment: 'positive' as const,
          },
          {
            advisorAnonymized: 'Advisor B',
            metric: 'Support Response Time',
            comment: 'Response times have been slower than usual lately',
            date: '2026-03-25',
            sentiment: 'negative' as const,
          },
          {
            advisorAnonymized: 'Advisor C',
            metric: 'Technical Expertise',
            comment: 'New technical team is very knowledgeable',
            date: '2026-03-20',
            sentiment: 'positive' as const,
          },
          {
            advisorAnonymized: 'Advisor D',
            metric: 'Co-Marketing',
            comment: 'Some initiatives incomplete, but communicative',
            date: '2026-03-18',
            sentiment: 'neutral' as const,
          },
        ],
      },
      advisorRatings: advisors.map((advisor) => {
        // Correlate ratings with friction levels
        // High friction advisors rate supplier lower
        const frictionMultiplier: Record<string, number> = {
          Low: 0.9,
          Moderate: 0.75,
          High: 0.55,
          Critical: 0.4,
        };

        const baseScore = 70;
        const multiplier = frictionMultiplier[advisor.friction] || 0.75;
        const score = Math.round(baseScore * multiplier + seededRandom(advisor.id) * 15);

        return {
          advisorId: advisor.id,
          advisorName: advisor.name,
          supplierScore: Math.max(20, Math.min(100, score)),
          metrics: {
            responsiveness: Math.max(20, Math.min(100, Math.round(score - seededRandom(`${advisor.id}-resp`) * 20))),
            dealSupport: Math.max(20, Math.min(100, Math.round(score - seededRandom(`${advisor.id}-deal`) * 25))),
            technicalKnowledge: Math.max(20, Math.min(100, Math.round(score + seededRandom(`${advisor.id}-tech`) * 10))),
            commissionReliability: Math.max(20, Math.min(100, Math.round(score + seededRandom(`${advisor.id}-comm`) * 15))),
          },
          lastRated: new Date(Date.now() - seededRandom(`${advisor.id}-date`) * 30 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0],
        };
      }),
    };

    return NextResponse.json(supplierData);
  } catch (err: any) {
    console.error('[API] GET /api/live/ratings error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to load ratings' },
      { status: 500 }
    );
  }
}
