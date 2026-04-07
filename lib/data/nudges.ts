import { Nudge } from '../types';

export const managerNudges: Nudge[] = [
  {
    id: 'nudge-m-1',
    title: 'Critical: Quarter Closes in 5 Days',
    description: 'Two deals must close this week to hit commit target. TelcoAdvise Phase 2 and NetConnect Infrastructure both in final negotiation. Recommended executive engagement on both.',
    time: '2026-03-26 08:00',
    type: 'quarter',
    priority: 'critical',
    linkTo: 'deal-1'
  },
  {
    id: 'nudge-m-2',
    title: 'Partner Friction Alert: WaveConnect Going Dark',
    description: 'Tom Bradley at WaveConnect has missed two meetings and response time increased from 2 to 5+ days. Channel Pipeline deal stuck in Stalled status for 67 days. Recommend immediate outreach to understand organizational changes.',
    time: '2026-03-26 09:15',
    type: 'engagement',
    priority: 'high',
    linkTo: 'advisor-6'
  },
  {
    id: 'nudge-m-3',
    title: 'Forecast Mismatch: FiberFirst Deals Need Override',
    description: 'Two FiberFirst deals (Capacity Planning and Signal Quality) have close dates in late March but are still in Discovery/Qualifying stages. Probability 10% and 5% respectively. Recommend override review or date adjustment.',
    time: '2026-03-26 10:30',
    type: 'forecast',
    priority: 'high',
    linkTo: 'deal-5'
  },
  {
    id: 'nudge-m-4',
    title: 'Opportunity: Rachel Kim Rising Star',
    description: 'Rachel Kim at SignalPath showing exceptional engagement trajectory. Just invited us to partner summit. Recommend expansion conversation around multi-year partnership framework.',
    time: '2026-03-26 11:45',
    type: 'win',
    priority: 'medium',
    linkTo: 'advisor-5'
  },
  {
    id: 'nudge-m-5',
    title: 'Pipeline Hygiene: Archive Non-Viable Partners',
    description: 'Nina Patel and Chris Donovan represent $7K MRR combined but show zero engagement and no movement in 8+ months. Recommend archiving both relationships to focus resources on viable partners.',
    time: '2026-03-26 13:00',
    type: 'hygiene',
    priority: 'medium',
    linkTo: 'advisor-9'
  }
];

export const leaderNudges: Nudge[] = [
  {
    id: 'nudge-l-1',
    title: 'CRITICAL: Team $1.2M Quota - Only 5 Days Left',
    description: 'Current total commit across all reps: $893K. Gap to target: $307K. Three reps below commit target. Ernie Vasquez at capacity ceiling. Recommend executive outreach to top 3 deals to accelerate close.',
    time: '2026-03-26 07:00',
    type: 'quarter',
    priority: 'critical',
    linkTo: 'rep-1'
  },
  {
    id: 'nudge-l-2',
    title: 'Capacity Crisis: Ernie Vasquez 57/30 Partners',
    description: 'Ernie is managing 27 partners above capacity. This is affecting deal velocity - several deals stalled. Recommend either partner consolidation with Ernie or rebalancing partners to other reps.',
    time: '2026-03-26 08:30',
    type: 'capacity',
    priority: 'critical',
    linkTo: 'rep-2'
  },
  {
    id: 'nudge-l-3',
    title: 'Team Health Alert: Derek Walker 3 Partners Dark',
    description: 'Derek reports 3 advisors went dark in past 3 weeks. Unknown status on their deals. Recommend immediate recon calls to understand issues and prevent further slippage.',
    time: '2026-03-26 09:45',
    type: 'engagement',
    priority: 'high',
    linkTo: 'rep-4'
  },
  {
    id: 'nudge-l-4',
    title: 'Bright Spot: Sarah Martinez 95% Win Rate',
    description: 'Sarah Martinez closed 3 deals this week despite smaller territory. 95% win rate is exceptional. Recommend studying her approach for team playbook and considering for senior role.',
    time: '2026-03-26 11:00',
    type: 'win',
    priority: 'medium',
    linkTo: 'rep-6'
  },
  {
    id: 'nudge-l-5',
    title: 'Partner Opportunity: Sarah Chen + Mike Rivera Momentum',
    description: 'Your two platinum partners (Sarah Chen and Mike Rivera) combined for $14.1M MRR and 52 active deals. Both showing acceleration trajectory. Recommend strategic account planning for expansion.',
    time: '2026-03-26 12:30',
    type: 'competitive',
    priority: 'medium',
    linkTo: 'advisor-1'
  },
  {
    id: 'nudge-l-6',
    title: 'Forecast Review Needed: Multiple Override Requests',
    description: 'Two deals in forecast with override flags: FiberFirst Capacity Planning and Signal Quality. Both aggressive close dates given current stage. Review with ops for forecast integrity.',
    time: '2026-03-26 14:00',
    type: 'override',
    priority: 'medium',
    linkTo: 'deal-5'
  },
  {
    id: 'nudge-l-7',
    title: 'Team Performance: Win Rate Variance',
    description: 'Win rates range from 68% (Derek Walker) to 95% (Sarah Martinez). Recommend coaching session on best practices from top performers. Angelo DiMartino also needs support - 74% win rate with 4 stalled deals.',
    time: '2026-03-26 15:15',
    type: 'hygiene',
    priority: 'medium',
    linkTo: 'rep-3'
  }
];
