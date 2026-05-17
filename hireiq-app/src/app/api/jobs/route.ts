import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const runtime = 'nodejs';

/** GET /api/jobs → list all jobs */
export async function GET() {
  const { data: jobs, error } = await supabase
    .from('jobs')
    .select('id, title, department, seniority_level, required_skills, preferred_skills, summary, created_at')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ jobs: jobs || [] });
}
