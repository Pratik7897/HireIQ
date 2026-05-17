import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const { data: candidates, error } = await supabase
    .from('candidates')
    .select('id, name, email, location, total_years_experience, status, created_at, parsed_json')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ candidates });
}
