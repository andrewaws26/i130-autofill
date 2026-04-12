import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { getServiceClient } from '@/lib/supabase';
import type { UserModuleProgress } from '@/lib/training-types';

export async function GET() {
  try {
    await requireRole(['admin']);
    const supabase = getServiceClient();

    // Fetch all progress records joined with module titles
    const { data, error } = await supabase
      .from('user_module_progress')
      .select('*, training_modules(title)')
      .order('clerk_user_id')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch supervisor data:', error);
      return NextResponse.json({ error: 'Failed to fetch supervisor data' }, { status: 500 });
    }

    // Group progress by user
    const userMap = new Map<
      string,
      (UserModuleProgress & { moduleTitle: string })[]
    >();

    for (const row of data || []) {
      const clerkUserId = row.clerk_user_id as string;
      const moduleData = row.training_modules as { title: string } | null;

      const progressEntry: UserModuleProgress & { moduleTitle: string } = {
        id: row.id,
        clerkUserId,
        moduleId: row.module_id,
        currentStep: row.current_step,
        status: row.status,
        score: row.score ?? null,
        startedAt: row.started_at ?? null,
        completedAt: row.completed_at ?? null,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        moduleTitle: moduleData?.title || 'Unknown Module',
      };

      if (!userMap.has(clerkUserId)) {
        userMap.set(clerkUserId, []);
      }
      userMap.get(clerkUserId)!.push(progressEntry);
    }

    const users = Array.from(userMap.entries()).map(([clerkUserId, modules]) => ({
      clerkUserId,
      name: '', // Clerk user names are resolved client-side
      role: '',  // Clerk roles are resolved client-side
      modules,
    }));

    return NextResponse.json({ users });
  } catch (thrown) {
    if (thrown instanceof Response) return thrown;
    console.error('Supervisor route error:', thrown);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
