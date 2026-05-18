import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';
  const limit  = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
  const offset = parseInt(searchParams.get('offset') || '0');
  const status = searchParams.get('status') || '';
  const sortBy = searchParams.get('sort') || 'created_at';
  const order  = searchParams.get('order') === 'asc' ? true : false;

  let query = supabase
    .from('candidates')
    .select('id, name, email, phone, location, created_at, status, total_years_experience, file_name, parsed_json', { count: 'exact' })
    .order(sortBy, { ascending: order })
    .range(offset, offset + limit - 1);

  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,location.ilike.%${search}%`);
  }

  if (status) {
    query = query.eq('status', status);
  }

  const { data: candidates, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    candidates: candidates || [],
    total: count || 0,
    limit,
    offset,
  });
}
