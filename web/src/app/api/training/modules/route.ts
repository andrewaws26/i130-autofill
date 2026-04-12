import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase';
import type { TrainingModule } from '@/lib/training-types';

export async function GET() {
  try {
    const supabase = getServiceClient();

    const { data, error } = await supabase
      .from('training_modules')
      .select('*')
      .eq('is_active', true)
      .order('practice_area')
      .order('sort_order');

    if (error) {
      console.error('Failed to fetch training modules:', error);
      return NextResponse.json({ error: 'Failed to fetch modules' }, { status: 500 });
    }

    const modules: TrainingModule[] = (data || []).map((row: Record<string, unknown>) => ({
      id: row.id as string,
      slug: row.slug as string,
      title: row.title as string,
      description: (row.description as string | null) ?? null,
      practiceArea: row.practice_area as string,
      durationMinutes: row.duration_minutes as number,
      sortOrder: row.sort_order as number,
      prerequisiteId: (row.prerequisite_id as string | null) ?? null,
      isActive: row.is_active as boolean,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    }));

    return NextResponse.json({ modules });
  } catch (error) {
    console.error('Training modules route error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
