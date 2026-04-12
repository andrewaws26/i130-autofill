import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getServiceClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth();
    const supabase = getServiceClient();

    const body = await request.json();
    const { questionId, selectedKey } = body as {
      questionId: string;
      selectedKey: string;
    };

    if (!questionId || !selectedKey) {
      return NextResponse.json({ error: 'Missing required fields: questionId, selectedKey' }, { status: 400 });
    }

    // Look up the question
    const { data: question, error: questionError } = await supabase
      .from('training_quiz_questions')
      .select('*')
      .eq('id', questionId)
      .single();

    if (questionError || !question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    const isCorrect = question.correct_key === selectedKey;
    const explanations = (question.explanations || {}) as Record<string, string>;
    const explanation = explanations[selectedKey] || '';

    // Get current attempt count for this user+question
    const { count } = await supabase
      .from('user_quiz_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('clerk_user_id', userId)
      .eq('question_id', questionId);

    const attemptNumber = (count || 0) + 1;

    // Insert the attempt
    const { error: insertError } = await supabase
      .from('user_quiz_attempts')
      .insert({
        clerk_user_id: userId,
        question_id: questionId,
        selected_key: selectedKey,
        is_correct: isCorrect,
        attempt_number: attemptNumber,
      });

    if (insertError) {
      console.error('Failed to insert quiz attempt:', insertError);
      return NextResponse.json({ error: 'Failed to save attempt' }, { status: 500 });
    }

    return NextResponse.json({ correct: isCorrect, explanation });
  } catch (thrown) {
    if (thrown instanceof Response) return thrown;
    console.error('Quiz route error:', thrown);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
