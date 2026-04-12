import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getServiceClient } from '@/lib/supabase';
import type { SimulationSession } from '@/lib/training-types';

function toSession(row: Record<string, unknown>): SimulationSession {
  return {
    id: row.id as string,
    clerkUserId: row.clerk_user_id as string,
    scenarioId: row.scenario_id as string,
    currentPhase: row.current_phase as number,
    status: row.status as SimulationSession['status'],
    decisions: (row.decisions as unknown[]) || [],
    chatMessages: (row.chat_messages as unknown[]) || [],
    score: (row.score as number | null) ?? null,
    maxScore: (row.max_score as number | null) ?? null,
    startedAt: row.started_at as string,
    completedAt: (row.completed_at as string | null) ?? null,
    updatedAt: row.updated_at as string,
  };
}

export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth();
    const supabase = getServiceClient();

    const scenarioId = request.nextUrl.searchParams.get('scenarioId');
    if (!scenarioId) {
      return NextResponse.json({ error: 'Missing required query param: scenarioId' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('simulation_sessions')
      .select('*')
      .eq('clerk_user_id', userId)
      .eq('scenario_id', scenarioId)
      .order('started_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      // No session found is not an error -- return null
      return NextResponse.json({ session: null });
    }

    return NextResponse.json({ session: toSession(data as Record<string, unknown>) });
  } catch (thrown) {
    if (thrown instanceof Response) return thrown;
    console.error('Simulation session GET error:', thrown);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth();
    const supabase = getServiceClient();

    const body = await request.json();
    const { scenarioId, maxScore } = body as {
      scenarioId: string;
      maxScore?: number;
    };

    if (!scenarioId) {
      return NextResponse.json({ error: 'Missing required field: scenarioId' }, { status: 400 });
    }

    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('simulation_sessions')
      .upsert(
        {
          clerk_user_id: userId,
          scenario_id: scenarioId,
          current_phase: 1,
          status: 'in_progress',
          decisions: [],
          chat_messages: [],
          score: 0,
          max_score: maxScore ?? null,
          started_at: now,
          updated_at: now,
        },
        { onConflict: 'clerk_user_id,scenario_id' }
      )
      .select()
      .single();

    if (error) {
      console.error('Failed to create simulation session:', error);
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    }

    return NextResponse.json({ session: toSession(data as Record<string, unknown>) });
  } catch (thrown) {
    if (thrown instanceof Response) return thrown;
    console.error('Simulation session POST error:', thrown);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const userId = await requireAuth();
    const supabase = getServiceClient();

    const body = await request.json();
    const { scenarioId, currentPhase, decisions, chatMessages, score, status } = body as {
      scenarioId: string;
      currentPhase?: number;
      decisions?: unknown[];
      chatMessages?: unknown[];
      score?: number;
      status?: 'in_progress' | 'completed';
    };

    if (!scenarioId) {
      return NextResponse.json({ error: 'Missing required field: scenarioId' }, { status: 400 });
    }

    const now = new Date().toISOString();

    // Build the update object with only provided fields
    const update: Record<string, unknown> = { updated_at: now };
    if (currentPhase !== undefined) update.current_phase = currentPhase;
    if (decisions !== undefined) update.decisions = decisions;
    if (chatMessages !== undefined) update.chat_messages = chatMessages;
    if (score !== undefined) update.score = score;
    if (status !== undefined) {
      update.status = status;
      if (status === 'completed') update.completed_at = now;
    }

    const { data, error } = await supabase
      .from('simulation_sessions')
      .update(update)
      .eq('clerk_user_id', userId)
      .eq('scenario_id', scenarioId)
      .select()
      .single();

    if (error) {
      console.error('Failed to update simulation session:', error);
      return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json({ session: toSession(data as Record<string, unknown>) });
  } catch (thrown) {
    if (thrown instanceof Response) return thrown;
    console.error('Simulation session PATCH error:', thrown);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
