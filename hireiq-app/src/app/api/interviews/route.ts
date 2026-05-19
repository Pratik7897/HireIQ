import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');

  let query = supabase
    .from('interviews')
    .select(`
      id, title, description, scheduled_at, duration_mins, status, interview_type,
      candidates (id, name, email)
    `)
    .order('scheduled_at', { ascending: true });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    // If table doesn't exist, return empty array to prevent UI crashing
    if (error.code === '42P01') {
      return NextResponse.json({ interviews: [] });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ interviews: data });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { candidate_id, title, scheduled_at, duration_mins, interview_type } = body;

    const { data, error } = await supabase
      .from('interviews')
      .insert({
        candidate_id,
        title,
        scheduled_at,
        duration_mins: duration_mins || 60,
        interview_type: interview_type || 'technical',
        status: 'scheduled'
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Also update candidate status to "interview"
    if (candidate_id) {
      await supabase
        .from('candidates')
        .update({ status: 'interview' })
        .eq('id', candidate_id);
    }

    return NextResponse.json({ interview: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
