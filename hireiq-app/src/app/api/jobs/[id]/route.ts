import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const runtime = 'nodejs';

/** GET /api/jobs/[id] — fetch job + candidate leaderboard */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;

  const [jobRes, scoresRes] = await Promise.all([
    supabase
      .from('jobs')
      .select('id, title, department, company, seniority_level, required_skills, preferred_skills, summary, created_at')
      .eq('id', id)
      .single(),
    supabase
      .from('candidate_scores')
      .select(`
        id, match_score, skill_match_pct, matched_skills, missing_skills,
        bonus_skills, score_reasoning, semantic_similarity, ai_summary, scored_at,
        candidates (id, name, email, location, total_years_experience, status)
      `)
      .eq('job_id', id)
      .order('match_score', { ascending: false }),
  ]);

  if (jobRes.error || !jobRes.data) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  return NextResponse.json({
    job: jobRes.data,
    leaderboard: scoresRes.data || [],
    total_scored: (scoresRes.data || []).length,
    shortlisted: (scoresRes.data || []).filter((s: any) => s.match_score >= 70).length,
  });
}
