import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';
  const limit  = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
  const offset = parseInt(searchParams.get('offset') || '0');
  const seniority = searchParams.get('seniority') || '';
  const status = searchParams.get('status') || '';

  let query = supabase
    .from('jobs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (search) {
    query = query.or(`title.ilike.%${search}%,department.ilike.%${search}%,company.ilike.%${search}%`);
  }

  if (seniority) {
    query = query.eq('seniority_level', seniority);
  }

  if (status) {
    query = query.eq('status', status);
  }

  const { data: jobs, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    jobs: jobs || [],
    total: count || 0,
    limit,
    offset,
  });
}
