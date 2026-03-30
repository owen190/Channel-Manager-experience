import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const advisorId = searchParams.get('advisorId');
  let deals = await db.getDeals();
  if (advisorId) deals = deals.filter(d => d.advisorId === advisorId);
  return NextResponse.json(deals);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const deal = await db.upsertDeal(body);
  await db.logActivity({
    dealId: deal.id,
    advisorId: deal.advisorId,
    repId: deal.repId,
    activityType: body.id ? 'deal_updated' : 'deal_created',
    description: `${body.id ? 'Updated' : 'Created'} deal: ${deal.name} ($${(deal.mrr/1000).toFixed(1)}K)`,
  });
  return NextResponse.json(deal, { status: body.id ? 200 : 201 });
}
