import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getServiceClient } from '@/lib/supabase';
import type {
  TrainingModule,
  TrainingModuleStep,
  TrainingQuizQuestion,
  UserModuleProgress,
} from '@/lib/training-types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const supabase = getServiceClient();

    // Fetch the module by slug
    const { data: moduleRow, error: moduleError } = await supabase
      .from('training_modules')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (moduleError || !moduleRow) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    const module: TrainingModule = {
      id: moduleRow.id,
      slug: moduleRow.slug,
      title: moduleRow.title,
      description: moduleRow.description ?? null,
      practiceArea: moduleRow.practice_area,
      durationMinutes: moduleRow.duration_minutes,
      sortOrder: moduleRow.sort_order,
      prerequisiteId: moduleRow.prerequisite_id ?? null,
      isActive: moduleRow.is_active,
      createdAt: moduleRow.created_at,
      updatedAt: moduleRow.updated_at,
    };

    // Fetch steps for this module
    const { data: stepRows, error: stepsError } = await supabase
      .from('training_module_steps')
      .select('*')
      .eq('module_id', module.id)
      .order('step_number');

    if (stepsError) {
      console.error('Failed to fetch module steps:', stepsError);
      return NextResponse.json({ error: 'Failed to fetch module steps' }, { status: 500 });
    }

    const steps: TrainingModuleStep[] = (stepRows || []).map((row: Record<string, unknown>) => ({
      id: row.id as string,
      moduleId: row.module_id as string,
      stepNumber: row.step_number as number,
      stepType: row.step_type as string,
      title: row.title as string,
      contentJson: row.content_json as TrainingModuleStep['contentJson'],
      createdAt: row.created_at as string,
    }));

    // Fetch quiz questions for all steps in this module
    const stepIds = steps.map((s) => s.id);
    let questions: TrainingQuizQuestion[] = [];

    if (stepIds.length > 0) {
      const { data: questionRows, error: questionsError } = await supabase
        .from('training_quiz_questions')
        .select('*')
        .in('step_id', stepIds)
        .order('question_number');

      if (questionsError) {
        console.error('Failed to fetch quiz questions:', questionsError);
      } else {
        questions = (questionRows || []).map((row: Record<string, unknown>) => ({
          id: row.id as string,
          stepId: row.step_id as string,
          questionNumber: row.question_number as number,
          questionText: row.question_text as string,
          options: row.options as TrainingQuizQuestion['options'],
          correctKey: row.correct_key as string,
          explanations: row.explanations as Record<string, string>,
          createdAt: row.created_at as string,
        }));
      }
    }

    // Try to get authenticated user's progress (optional, don't require auth)
    let progress: UserModuleProgress | null = null;

    try {
      const { userId } = await auth();
      if (userId) {
        const { data: progressRow } = await supabase
          .from('user_module_progress')
          .select('*')
          .eq('clerk_user_id', userId)
          .eq('module_id', module.id)
          .single();

        if (progressRow) {
          progress = {
            id: progressRow.id,
            clerkUserId: progressRow.clerk_user_id,
            moduleId: progressRow.module_id,
            currentStep: progressRow.current_step,
            status: progressRow.status,
            score: progressRow.score ?? null,
            startedAt: progressRow.started_at ?? null,
            completedAt: progressRow.completed_at ?? null,
            createdAt: progressRow.created_at,
            updatedAt: progressRow.updated_at,
          };
        }
      }
    } catch {
      // Auth not available -- that's fine, just skip progress
    }

    return NextResponse.json({ module, steps, questions, progress });
  } catch (error) {
    console.error('Module detail route error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
