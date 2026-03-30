import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { db } from '@/lib/db';

const SYSTEM_PROMPT = `You are an AI assistant embedded in Channel Companion, a channel management platform.
You help channel managers and sales leaders manage their partner relationships, pipeline, and team performance.

Your tone is professional but warm — like a sharp colleague who's read all the CRM data and call notes.
Be specific. Reference actual names, deal values, stages, and dates from the context provided.
Keep responses concise (2-4 paragraphs max). Use bullet points sparingly and only when listing multiple items.

When asked about an advisor, reference their deals, recent notes, call transcripts, and personal intel.
When asked about the portfolio, give actionable insights, not just summaries.
When asked to prep for a call, give specific talking points with personal connection hooks.`;

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      response: 'AI is not configured yet. Set ANTHROPIC_API_KEY in your environment variables.',
    });
  }

  const { message, advisorId, role, conversationHistory } = await req.json();

  // Build context from database
  const context = await db.buildAIContext(advisorId || undefined);

  const client = new Anthropic({ apiKey });

  try {
    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

    // Include conversation history if provided
    if (conversationHistory && Array.isArray(conversationHistory)) {
      for (const msg of conversationHistory.slice(-10)) {
        messages.push({
          role: msg.type === 'user' ? 'user' : 'assistant',
          content: msg.text,
        });
      }
    }

    // Add current message with context
    messages.push({
      role: 'user',
      content: `[LIVE DATA CONTEXT]\n${context}\n\n[USER ROLE: ${role || 'manager'}]\n\n${message}`,
    });

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages,
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';

    return NextResponse.json({ response: text });
  } catch (error: unknown) {
    console.error('Claude API error:', error);
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({
      response: `AI temporarily unavailable. Error: ${errMsg}`,
    });
  }
}
