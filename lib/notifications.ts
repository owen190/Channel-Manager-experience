import { db } from '@/lib/db';

/**
 * Create a notification in the database
 */
export async function createNotification(params: {
  userId?: string;
  orgId?: string;
  type: string;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
}) {
  return await db.createNotification({
    userId: params.userId,
    orgId: params.orgId,
    type: params.type,
    title: params.title,
    message: params.message,
    entityType: params.entityType,
    entityId: params.entityId,
    read: false,
  });
}

/**
 * Scan advisors for high/critical friction and create alerts
 */
export async function generateFrictionAlerts() {
  const advisors = await db.getAdvisors();
  const alerts = [];

  for (const advisor of advisors) {
    if (advisor.friction === 'High' || advisor.friction === 'Critical') {
      const notif = await createNotification({
        type: 'friction_alert',
        title: `High friction with ${advisor.name}`,
        message: `${advisor.name} at ${advisor.company} is showing ${advisor.friction} friction. Last contact: ${advisor.connectedSince || 'unknown'}.`,
        entityType: 'advisor',
        entityId: advisor.id,
      });
      alerts.push(notif);
    }
  }

  return alerts;
}

/**
 * Scan deals for health changes and create alerts
 */
export async function generateDealAlerts() {
  const deals = await db.getDeals();
  const alerts = [];

  for (const deal of deals) {
    if (deal.health === 'At Risk' || deal.health === 'Stalled') {
      const advisor = await db.getAdvisor(deal.advisorId);
      const notif = await createNotification({
        type: 'deal_health_change',
        title: `${deal.health} deal: ${deal.name}`,
        message: `${deal.name} is ${deal.health.toLowerCase()}. Stage: ${deal.stage}, MRR: $${(deal.mrr / 1000).toFixed(1)}K.`,
        entityType: 'deal',
        entityId: deal.id,
      });
      alerts.push(notif);
    }
  }

  return alerts;
}

/**
 * Generate a daily morning briefing notification
 */
export async function generateMorningBriefing() {
  const [advisors, deals, reps] = await Promise.all([
    db.getAdvisors(),
    db.getDeals(),
    db.getReps(),
  ]);

  const atRiskCount = advisors.filter(
    (a) => a.friction === 'High' || a.friction === 'Critical'
  ).length;
  const stalledCount = deals.filter((d) => d.stage === 'Stalled').length;
  const totalMRR = advisors.reduce((sum, a) => sum + a.mrr, 0);

  const notif = await createNotification({
    type: 'system',
    title: 'Morning Briefing',
    message: `Portfolio: ${advisors.length} advisors, $${(totalMRR / 1000).toFixed(0)}K MRR. At risk: ${atRiskCount}. Stalled deals: ${stalledCount}.`,
  });

  return notif;
}

/**
 * Generate score update notification
 */
export async function notifyScoreUpdate(advisorId: string, oldScore: number, newScore: number) {
  const advisor = await db.getAdvisor(advisorId);
  if (!advisor) return null;

  const change = newScore - oldScore;
  const direction = change > 0 ? 'increased' : change < 0 ? 'decreased' : 'unchanged';

  return await createNotification({
    type: 'score_update',
    title: `Score ${direction} for ${advisor.name}`,
    message: `${advisor.name}'s engagement score ${direction} to ${newScore}/100 (was ${oldScore}/100).`,
    entityType: 'advisor',
    entityId: advisorId,
  });
}
