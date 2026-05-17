import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const runtime = 'nodejs';

/** GET /api/jobs/[id] — fetch job + candidate leaderboard */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const [jobRes, scoresRes, biasRes] = await Promise.all([
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
    supabase
      .from('bias_flags')
      .select('*')
      .eq('job_id', id)
      .order('created_at', { ascending: false })
  ]);

  if (jobRes.error || !jobRes.data) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  const leaderboard = scoresRes.data || [];

  return NextResponse.json({
    job: jobRes.data,
    leaderboard,
    biasFlags: biasRes.data || [],
    total_scored: leaderboard.length,
    shortlisted: leaderboard.filter((s: any) => s.match_score >= 70).length,
  });
}
