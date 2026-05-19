import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { parseResumeWithAI, analyseResumeForBias } from '@/lib/ai';

export const runtime = 'nodejs';
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ];
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(pdf|docx|doc)$/i)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload PDF or DOCX' },
        { status: 400 }
      );
    }
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Max 5MB' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // ── Send to Python AI backend for parsing ──────────────────────────────
    let parsedData;
    let rawText = '';
    let embedding: number[] = [];

    try {
      const aiResult = await parseResumeWithAI(buffer, file.name);
      parsedData = aiResult.parsed;
      rawText = aiResult.raw_text;
      embedding = aiResult.embedding;
    } catch (aiErr) {
      logger.error('AI backend error:', aiErr);
      return NextResponse.json(
        {
          error:
            'AI backend is not running. Start it with: cd python-backend && bash start.sh',
        },
        { status: 503 }
      );
    }

    // ── Upload file to Supabase Storage ────────────────────────────────────
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
    const { data: storageData, error: storageErr } = await supabase.storage
      .from('resumes')
      .upload(fileName, buffer, { contentType: file.type, upsert: false });

    if (storageErr) logger.error('Storage upload error:', storageErr);

    const fileUrl = storageData
      ? supabase.storage.from('resumes').getPublicUrl(fileName).data.publicUrl
      : null;

    // ── Save to Supabase candidates table ──────────────────────────────────
    const { data: candidate, error: dbError } = await supabase
      .from('candidates')
      .insert({
        name: parsedData?.name || null,
        email: parsedData?.email || null,
        phone: parsedData?.phone || null,
        location: parsedData?.location || null,
        raw_text: rawText.slice(0, 50000),
        parsed_json: parsedData || {},
        resume_embedding: embedding.length ? embedding : null,
        file_url: fileUrl,
        file_name: file.name,
        total_years_experience: parsedData?.total_years_experience || null,
      })
      .select()
      .single();

    if (dbError) {
      logger.error('DB insert error:', dbError);
      return NextResponse.json({ error: 'Failed to save candidate' }, { status: 500 });
    }

    // ── Log hiring event ───────────────────────────────────────────────────
    await supabase.from('hiring_events').insert({
      candidate_id: candidate.id,
      event_type: 'resume_uploaded',
      event_data: {
        file_name: file.name,
        file_size: file.size,
        ai_source: parsedData?._source || 'unknown',
        skills_found: (parsedData?.skills || []).length,
      },
    });

    // ── Detect and save bias flags ───────────────────────────────────────
    try {
      const biasResult = await analyseResumeForBias(rawText);
      if (biasResult && biasResult.flags && biasResult.flags.length > 0) {
        const biasInserts = biasResult.flags.map((f: any) => ({
          candidate_id: candidate.id,
          flag_type: f.flag_type,
          flag_text: f.flag_text,
          severity: f.severity,
          guidance: f.guidance,
          overall_risk: biasResult.overall_risk || 'low'
        }));
        await supabase.from('bias_flags').insert(biasInserts);

        // Log bias event
        await supabase.from('hiring_events').insert({
          candidate_id: candidate.id,
          event_type: 'bias_detected',
          event_data: { flag_count: biasResult.flags.length, overall_risk: biasResult.overall_risk }
        });
      }
    } catch (biasErr) {
      logger.error('Bias detection failed:', biasErr);
    }

    return NextResponse.json({ success: true, candidate });
  } catch (err) {
    logger.error('Upload route error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
