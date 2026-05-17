import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const runtime = 'nodejs';
export const maxDuration = 120;

const AI_BACKEND = process.env.AI_BACKEND_URL || 'http://localhost:8000';

/**
 * GET /api/interview-questions?candidate_id=&job_id=
 * Generate (or fetch cached) 5 interview questions for a candidate+job pair.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const candidate_id = searchParams.get('candidate_id');
  const job_id       = searchParams.get('job_id');

  if (!candidate_id || !job_id) {
    return NextResponse.json({ error: 'candidate_id and job_id required' }, { status: 400 });
  }

  // Check if we already have questions stored
  const { data: score } = await supabase
    .from('candidate_scores')
    .select('interview_questions, missing_skills, candidates(name), job_id')
    .eq('candidate_id', candidate_id)
    .eq('job_id', job_id)
    .single();

  if (score?.interview_questions) {
    return NextResponse.json({ questions: score.interview_questions, cached: true });
  }

  // Fetch missing skills + job title
  const [scoreRes, jobRes, candRes] = await Promise.all([
    supabase.from('candidate_scores').select('missing_skills').eq('candidate_id', candidate_id).eq('job_id', job_id).single(),
    supabase.from('jobs').select('title').eq('id', job_id).single(),
    supabase.from('candidates').select('name').eq('id', candidate_id).single(),
  ]);

  const missingSkills = scoreRes.data?.missing_skills || [];
  const jobTitle      = jobRes.data?.title || 'this role';
  const candName      = candRes.data?.name || 'Candidate';

  // Generate from Python backend
  const res = await fetch(`${AI_BACKEND}/api/interview-questions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ missing_skills: missingSkills, job_title: jobTitle, candidate_name: candName }),
  });

  const data = await res.json();
  const questions = data.questions || [];

  // Cache in DB
  if (questions.length) {
    await supabase
      .from('candidate_scores')
      .update({ interview_questions: questions })
      .eq('candidate_id', candidate_id)
      .eq('job_id', job_id);
  }

  return NextResponse.json({ questions, cached: false });
}
