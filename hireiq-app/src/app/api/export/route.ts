import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const runtime = 'nodejs';

function escapeCSV(val: unknown): string {
  const s = val == null ? '' : String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function rowToCSV(obj: Record<string, unknown>, keys: string[]): string {
  return keys.map(k => escapeCSV(obj[k])).join(',');
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'candidates';
  const status = searchParams.get('status') || '';
  const jobId = searchParams.get('job_id') || '';

  if (type === 'candidates') {
    let query = supabase
      .from('candidates')
      .select('id, name, email, phone, location, total_years_experience, status, created_at, file_name')
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const keys = ['id', 'name', 'email', 'phone', 'location', 'total_years_experience', 'status', 'created_at', 'file_name'];
    const header = ['ID', 'Name', 'Email', 'Phone', 'Location', 'Years Experience', 'Status', 'Uploaded At', 'File Name'];
    const rows = (data || []).map(r => rowToCSV(r as Record<string, unknown>, keys));

    const csv = [header.join(','), ...rows].join('\n');
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="hireiq-candidates-${Date.now()}.csv"`,
      },
    });
  }

  if (type === 'scores' && jobId) {
    const { data, error } = await supabase
      .from('candidate_scores')
      .select(`
        id, match_score, skill_match_pct, semantic_similarity,
        matched_skills, missing_skills, score_reasoning, scored_at,
        candidates (name, email),
        jobs (title)
      `)
      .eq('job_id', jobId)
      .order('match_score', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const header = ['Rank', 'Candidate', 'Email', 'Job', 'Match Score', 'Semantic Similarity', 'Skill Match %', 'Matched Skills', 'Missing Skills', 'Reasoning', 'Scored At'];
    const rows = (data || []).map((r: any, i) => [
      i + 1,
      r.candidates?.name || '',
      r.candidates?.email || '',
      r.jobs?.title || '',
      r.match_score,
      r.semantic_similarity,
      r.skill_match_pct,
      (r.matched_skills || []).join('; '),
      (r.missing_skills || []).join('; '),
      r.score_reasoning || '',
      r.scored_at,
    ].map(v => escapeCSV(v)).join(','));

    const csv = [header.join(','), ...rows].join('\n');
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="hireiq-scores-${jobId.slice(0, 8)}-${Date.now()}.csv"`,
      },
    });
  }

  if (type === 'bias') {
    const { data, error } = await supabase
      .from('bias_flags')
      .select('id, flag_type, flag_text, severity, overall_risk, guidance, created_at, candidates(name, email)')
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const header = ['Candidate', 'Email', 'Flag Type', 'Flag Text', 'Severity', 'Overall Risk', 'Guidance', 'Detected At'];
    const rows = (data || []).map((r: any) => [
      r.candidates?.name || '',
      r.candidates?.email || '',
      r.flag_type,
      r.flag_text,
      r.severity,
      r.overall_risk,
      r.guidance,
      r.created_at,
    ].map(v => escapeCSV(v)).join(','));

    const csv = [header.join(','), ...rows].join('\n');
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="hireiq-bias-flags-${Date.now()}.csv"`,
      },
    });
  }

  return NextResponse.json({ error: 'Invalid export type' }, { status: 400 });
}
