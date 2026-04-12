import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getServiceClient } from '@/lib/supabase';
import type { UserModuleProgress } from '@/lib/training-types';

function toProgress(row: Record<string, unknown>): UserModuleProgress {
  return {
    id: row.id as string,
    clerkUserId: row.clerk_user_id as string,
    moduleId: row.module_id as string,
    currentStep: row.current_step as number,
    status: row.status as UserModuleProgress['status'],
    score: (row.score as number | null) ?? null,
    startedAt: (row.started_at as string | null) ?? null,
    completedAt: (row.completed_at as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export async function GET() {
  try {
    const userId = await requireAuth();
    const supabase = getServiceClient();

    const { data, error } = await supabase
      .from('user_module_progress')
      .select('*')
      .eq('clerk_user_id', userId);

    if (error) {
      console.error('Failed to fetch progress:', error);
      return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 });
    }

    const progress: UserModuleProgress[] = (data || []).map(toProgress);

    return NextResponse.json({ progress });
  } catch (thrown) {
    if (thrown instanceof Response) return thrown;
    console.error('Progress GET route error:', thrown);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth();
    const supabase = getServiceClient();

    const body = await request.json();
    const { moduleId, currentStep, status, score } = body as {
      moduleId: string;
      currentStep: number;
      status: 'not_started' | 'in_progress' | 'completed';
      score?: number | null;
    };

    if (!moduleId || currentStep == null || !status) {
      return NextResponse.json({ error: 'Missing required fields: moduleId, currentStep, status' }, { status: 400 });
    }

    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('user_module_progress')
      .upsert(
        {
          clerk_user_id: userId,
          module_id: moduleId,
          current_step: currentStep,
          status,
          score: score ?? null,
          started_at: status === 'in_progress' || status === 'completed' ? now : null,
          completed_at: status === 'completed' ? now : null,
          updated_at: now,
        },
        { onConflict: 'clerk_user_id,module_id' }
      )
      .select()
      .single();

    if (error) {
      console.error('Failed to upsert progress:', error);
      return NextResponse.json({ error: 'Failed to save progress' }, { status: 500 });
    }

    const progress = toProgress(data as Record<string, unknown>);

    return NextResponse.json({ progress });
  } catch (thrown) {
    if (thrown instanceof Response) return thrown;
    console.error('Progress POST route error:', thrown);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
