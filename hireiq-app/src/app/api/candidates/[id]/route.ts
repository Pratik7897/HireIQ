import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const [candRes, scoresRes, biasRes] = await Promise.all([
    supabase.from('candidates').select('*').eq('id', id).single(),
    supabase
      .from('candidate_scores')
      .select(`
        id, match_score, skill_match_pct, semantic_similarity,
        matched_skills, missing_skills, bonus_skills,
        score_reasoning, ai_summary, scored_at,
        jobs (id, title, department, seniority_level)
      `)
      .eq('candidate_id', id)
      .order('match_score', { ascending: false }),
    supabase.from('bias_flags').select('*').eq('candidate_id', id),
  ]);

  if (candRes.error || !candRes.data) {
    return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
  }

  return NextResponse.json({
    candidate: candRes.data,
    scores:    scoresRes.data || [],
    biasFlags: biasRes.data   || [],
  });
}
