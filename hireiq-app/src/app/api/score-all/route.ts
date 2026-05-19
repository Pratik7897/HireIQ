import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const maxDuration = 300; // bulk scoring can take time

const AI_BACKEND = process.env.AI_BACKEND_URL || 'http://localhost:8000';

/**
 * POST /api/score-all
 * Body: { job_id: string }
 * Scores every candidate against the given JD using Python AI backend.
 * Saves results to candidate_scores table and logs hiring_events.
 */
export async function POST(req: NextRequest) {
  try {
    const { job_id } = await req.json();
    if (!job_id) return NextResponse.json({ error: 'job_id required' }, { status: 400 });

    // Fetch the job (we need its embedding + skills)
    const { data: job, error: jobErr } = await supabase
      .from('jobs')
      .select('id, title, required_skills, preferred_skills, jd_embedding, raw_jd_text, summary')
      .eq('id', job_id)
      .single();

    if (jobErr || !job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });

    // Get or regenerate JD embedding
    let jdEmbedding: number[] = job.jd_embedding as number[] || [];
    if (!jdEmbedding.length && job.raw_jd_text) {
      const r = await fetch(`${AI_BACKEND}/api/parse-jd`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: job.raw_jd_text }),
      });
      const parsed = await r.json();
      jdEmbedding = parsed.embedding || [];
      if (jdEmbedding.length) {
        await supabase.from('jobs').update({ jd_embedding: jdEmbedding }).eq('id', job_id);
      }
    }

    if (!jdEmbedding.length) {
      return NextResponse.json({ error: 'JD embedding unavailable. Try re-uploading the JD.' }, { status: 422 });
    }

    // Fetch all candidates
    const { data: candidates, error: candErr } = await supabase
      .from('candidates')
      .select('id, name, parsed_json, total_years_experience, resume_embedding');

    if (candErr) return NextResponse.json({ error: candErr.message }, { status: 500 });
    if (!candidates || candidates.length === 0) {
      return NextResponse.json({ message: 'No candidates to score', scored: 0 });
    }

    const results: any[] = [];
    let scoredCount = 0;
    let errorCount = 0;

    // Score each candidate
    for (const candidate of candidates) {
      try {
        const parsed: any = candidate.parsed_json || {};
        const skills: string[] = parsed.skills || [];
        const exp = candidate.total_years_experience || parsed.total_years_experience || 0;

        // Get/generate candidate embedding
        const candEmbedding: number[] = (candidate.resume_embedding as number[]) || [];
        if (!candEmbedding.length) {
          // Generate embedding from skills + name
          const embedText = `${parsed.name || ''} ${skills.join(' ')} ${
            (parsed.experience || []).map((e: any) => `${e.title} ${e.description}`).join(' ')
          }`;
          try {
            const r = await fetch(`${AI_BACKEND}/api/parse-resume`, {
              method: 'POST',
            });
            // We don't have the file, so skip embedding for now
          } catch (_) {}
        }

        // Call scoring endpoint
        const scoreRes = await fetch(`${AI_BACKEND}/api/score`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            candidate_name: candidate.name || 'Unknown',
            candidate_skills: skills,
            candidate_embedding: candEmbedding.length ? candEmbedding : Array(384).fill(0),
            experience_years: exp,
            job_title: job.title,
            required_skills: job.required_skills || [],
            preferred_skills: job.preferred_skills || [],
            jd_embedding: jdEmbedding,
          }),
        });

        const scoreData = await scoreRes.json();
        if (!scoreRes.ok) { errorCount++; continue; }

        const matchScore = scoreData.match_score ?? 0;
        const matched   = scoreData.matched_skills   || [];
        const missing   = scoreData.missing_skills   || [];
        const bonus     = scoreData.bonus_skills      || [];
        const reasoning = scoreData.score_reasoning  || '';
        const semantic  = scoreData.semantic_similarity ?? 0;

        // Upsert score
        const { error: upsertErr } = await supabase
          .from('candidate_scores')
          .upsert({
            candidate_id: candidate.id,
            job_id,
            match_score: matchScore,
            skill_match_pct: matched.length > 0
              ? Math.round((matched.length / Math.max((job.required_skills || []).length, 1)) * 100)
              : 0,
            matched_skills: matched,
            missing_skills: missing,
            bonus_skills:   bonus,
            score_reasoning: reasoning,
            semantic_similarity: Math.round(semantic),
            scored_at: new Date().toISOString(),
          }, { onConflict: 'candidate_id,job_id' });

        if (!upsertErr) {
          scoredCount++;
          results.push({
            candidate_id: candidate.id,
            candidate_name: candidate.name,
            match_score: matchScore,
            matched_skills: matched,
            missing_skills: missing,
          });
        } else {
          errorCount++;
        }

        // Log event
        await supabase.from('hiring_events').insert({
          candidate_id: candidate.id,
          job_id,
          event_type: 'candidate_scored',
          event_data: { match_score: matchScore, job_title: job.title },
        });

        // Auto-shortlist if score >= 70
        if (matchScore >= 70) {
          await supabase
            .from('candidates')
            .update({ status: 'shortlisted' })
            .eq('id', candidate.id);

          await supabase.from('hiring_events').insert({
            candidate_id: candidate.id,
            job_id,
            event_type: 'candidate_shortlisted',
            event_data: { match_score: matchScore, job_title: job.title, threshold: 70 },
          });
        }
      } catch (err) {
        errorCount++;
        logger.error(`Error scoring candidate ${candidate.id}:`, err);
      }
    }

    // Sort by score desc
    results.sort((a, b) => b.match_score - a.match_score);

    return NextResponse.json({
      success: true,
      job_id,
      job_title: job.title,
      scored: scoredCount,
      errors: errorCount,
      total: candidates.length,
      results,
    });
  } catch (err: any) {
    logger.error('Score-all error:', err);
    return NextResponse.json({ error: err.message || 'Scoring failed' }, { status: 500 });
  }
}
