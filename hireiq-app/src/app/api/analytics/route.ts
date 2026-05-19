import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';

export async function GET() {
  try {
    // Run all queries in parallel
    const [
      candidatesRes,
      jobsRes,
      scoresRes,
      biasRes,
      eventsRes,
      recentEventsRes,
    ] = await Promise.all([
      supabase.from('candidates').select('id, created_at, name'),
      supabase.from('jobs').select('id, created_at, title'),
      supabase.from('candidate_scores').select('match_score, scored_at'),
      supabase.from('bias_flags').select('severity, flag_type, created_at'),
      supabase.from('hiring_events').select('event_type, created_at').order('created_at', { ascending: false }).limit(200),
      supabase.from('hiring_events').select('event_type, created_at, event_data').order('created_at', { ascending: false }).limit(20),
    ]);

    const candidates = candidatesRes.data || [];
    const jobs       = jobsRes.data       || [];
    const scores     = scoresRes.data     || [];
    const biasFlags  = biasRes.data       || [];
    const events     = eventsRes.data     || [];

    // ── Compute metrics ──────────────────────────────────────────────────
    const avgScore = scores.length
      ? Math.round(scores.reduce((s, r) => s + (r.match_score || 0), 0) / scores.length)
      : 0;

    // Candidates uploaded per day (last 14 days)
    const now = Date.now();
    const dayMs = 86400000;
    const uploadTrend = Array.from({ length: 14 }, (_, i) => {
      const d = new Date(now - (13 - i) * dayMs);
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const count = candidates.filter(c => {
        const cd = new Date(c.created_at).toDateString();
        return cd === d.toDateString();
      }).length;
      return { date: label, count };
    });

    // Event type breakdown
    const eventCounts: Record<string, number> = {};
    for (const ev of events) {
      eventCounts[ev.event_type] = (eventCounts[ev.event_type] || 0) + 1;
    }
    const eventBreakdown = Object.entries(eventCounts).map(([name, value]) => ({ name, value }));

    // Bias severity distribution
    const biasDist: Record<string, number> = { low: 0, medium: 0, high: 0 };
    for (const b of biasFlags) {
      const s = (b.severity || 'low').toLowerCase();
      biasDist[s] = (biasDist[s] || 0) + 1;
    }

    // Score distribution buckets
    const scoreBuckets = [
      { label: '0–20',  min: 0,  max: 20  },
      { label: '21–40', min: 21, max: 40  },
      { label: '41–60', min: 41, max: 60  },
      { label: '61–80', min: 61, max: 80  },
      { label: '81–100',min: 81, max: 100 },
    ].map(b => ({
      range: b.label,
      count: scores.filter(s => (s.match_score || 0) >= b.min && (s.match_score || 0) <= b.max).length,
    }));

    // Recent activity feed
    const recentActivity = (recentEventsRes.data || []).map(ev => ({
      type: ev.event_type,
      at: ev.created_at,
      label: (ev.event_type as string).replace(/_/g, ' '),
      data: ev.event_data,
    }));

    return NextResponse.json({
      stats: {
        totalCandidates: candidates.length,
        totalJobs:       jobs.length,
        avgMatchScore:   avgScore,
        totalBiasFlags:  biasFlags.length,
        totalScored:     scores.length,
      },
      charts: {
        uploadTrend,
        eventBreakdown,
        biasDist: Object.entries(biasDist).map(([name, value]) => ({ name, value })),
        scoreDist: scoreBuckets,
      },
      recentActivity,
    });
  } catch (err) {
    logger.error('Analytics error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
