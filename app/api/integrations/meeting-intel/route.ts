import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { webhookSource, transcript, participants, recordedAt, metadata } = body;

    if (!transcript || !participants) {
      return NextResponse.json(
        { error: 'Missing required fields: transcript, participants' },
        { status: 400 }
      );
    }

    // Match participants to advisors by email or name
    let matchedAdvisorId: string | null = null;

    if (participants.length > 0) {
      const participant = participants[0];
      const matchedAdvisor = await findAdvisorByParticipant(participant);
      if (matchedAdvisor) {
        matchedAdvisorId = matchedAdvisor.id;
      }
    }

    // Create transcript record in database
    const transcriptId = crypto.randomUUID();
    // For now, save transcript data in memory - full implementation will use db
    // await db.query(...);

    // Trigger sentiment analysis (scaffolded)
    await triggerSentimentAnalysis(transcriptId, transcript, matchedAdvisorId);

    return NextResponse.json(
      {
        success: true,
        transcriptId,
        advisorId: matchedAdvisorId,
        message: 'Transcript received and queued for analysis',
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('[API] POST /api/integrations/meeting-intel error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to process meeting transcript' },
      { status: 500 }
    );
  }
}

async function findAdvisorByParticipant(participant: any): Promise<any> {
  try {
    // For now, just return null - full implementation will query advisors
    return null;
  } catch (error) {
    console.error('Failed to find advisor by participant:', error);
    return null;
  }
}

async function triggerSentimentAnalysis(
  transcriptId: string,
  transcript: string,
  advisorId: string | null
) {
  try {
    // Scaffolded: In production, this would:
    // 1. Call the scoring engine to analyze sentiment
    // 2. Extract key topics and action items
    // 3. Update advisor engagement scores
    // 4. Trigger notifications if critical issues detected

    console.log(`Sentiment analysis queued for transcript ${transcriptId}`);

    // Placeholder: would integrate with Anthropic Claude API
    // const analysis = await analyzeTranscriptSentiment(transcript);

    return true;
  } catch (error) {
    console.error('Failed to trigger sentiment analysis:', error);
    return false;
  }
}
