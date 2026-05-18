import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data: scores, error } = await supabase
    .from('candidate_scores')
    .select(`
      id, job_id, match_score, skill_match_pct, semantic_similarity,
      matched_skills, missing_skills, bonus_skills,
      score_reasoning, ai_summary, scored_at,
      jobs (id, title, department, seniority_level)
    `)
    .eq('candidate_id', id)
    .order('match_score', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Flatten job title into scores
  const mapped = (scores || []).map((s: any) => ({
    ...s,
    job_title: s.jobs?.title || null,
    job_department: s.jobs?.department || null,
    job_seniority: s.jobs?.seniority_level || null,
    jobs: undefined,
  }));

  return NextResponse.json({ scores: mapped });
}
