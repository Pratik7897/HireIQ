import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data: candidate, error } = await supabase
    .from('candidates')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !candidate) {
    return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
  }

  // Get scores
  const { data: scores } = await supabase
    .from('candidate_scores')
    .select('*, jobs(title, department)')
    .eq('candidate_id', id);

  // Get bias flags
  const { data: biasFlags } = await supabase
    .from('bias_flags')
    .select('*')
    .eq('candidate_id', id);

  return NextResponse.json({ candidate, scores: scores || [], biasFlags: biasFlags || [] });
}
