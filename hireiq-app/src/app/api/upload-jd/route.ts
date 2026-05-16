import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { parseJDWithAI } from '@/lib/ai';

export const runtime = 'nodejs';
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, title, department } = body;

    if (!text || text.trim().length < 30) {
      return NextResponse.json({ error: 'JD text is too short' }, { status: 400 });
    }

    // ── Parse JD with Python AI backend ───────────────────────────────────
    let parsedJD = null;
    let jdEmbedding: number[] = [];

    try {
      const aiResult = await parseJDWithAI(text);
      parsedJD = aiResult.parsed;
      jdEmbedding = aiResult.embedding;
    } catch (aiErr) {
      console.error('AI backend error for JD:', aiErr);
      return NextResponse.json(
        {
          error:
            'AI backend is not running. Start it with: cd python-backend && bash start.sh',
        },
        { status: 503 }
      );
    }

    // ── Save to Supabase jobs table ────────────────────────────────────────
    const { data: job, error: dbError } = await supabase
      .from('jobs')
      .insert({
        title: parsedJD?.title || title || 'Untitled Position',
        department: parsedJD?.department || department || null,
        company: parsedJD?.company || null,
        seniority_level: parsedJD?.seniority_level || null,
        raw_jd_text: text,
        required_skills: parsedJD?.required_skills || [],
        preferred_skills: parsedJD?.preferred_skills || [],
      })
      .select()
      .single();

    if (dbError) {
      console.error('DB insert error:', dbError);
      return NextResponse.json({ error: 'Failed to save job' }, { status: 500 });
    }

    return NextResponse.json({ success: true, job, embedding: jdEmbedding });
  } catch (err) {
    console.error('JD upload error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  const { data: jobs, error } = await supabase
    .from('jobs')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ jobs });
}
