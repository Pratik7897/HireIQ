'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Avatar, EmptyState, SkillChips, ScoreBar } from '@/components/ui/Primitives';

interface CompareCandidate {
  id: string;
  name: string;
  email: string;
  exp: number;
  skills: string[];
  score: number;
  status: string;
}

function CompareContent() {
  const searchParams = useSearchParams();
  const [candidates, setCandidates] = useState<CompareCandidate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ids = searchParams.get('ids')?.split(',').filter(Boolean) || [];
    if (ids.length === 0) {
      setLoading(false);
      return;
    }

    const fetchCandidates = async () => {
      try {
        const [candRes, scoreRes] = await Promise.all([
          supabase
            .from('candidates')
            .select('id, name, email, total_years_experience, status, parsed_json')
            .in('id', ids),
          supabase
            .from('candidate_scores')
            .select('candidate_id, match_score, matched_skills')
            .in('candidate_id', ids)
        ]);

        if (candRes.error) throw candRes.error;

        const scoresMap: Record<string, { score: number; skills: string[] }> = {};
        (scoreRes.data || []).forEach(s => {
          // Keep the highest score if multiple jobs are scored
          if (!scoresMap[s.candidate_id] || s.match_score > scoresMap[s.candidate_id].score) {
            scoresMap[s.candidate_id] = {
              score: s.match_score || 0,
              skills: s.matched_skills || []
            };
          }
        });

        const mapped: CompareCandidate[] = (candRes.data || []).map(c => {
          let parsedSkills: string[] = [];
          try {
            const parsed = typeof c.parsed_json === 'string' ? JSON.parse(c.parsed_json) : c.parsed_json;
            parsedSkills = parsed?.skills || parsed?.extracted_skills || [];
          } catch {
            parsedSkills = [];
          }

          const matchDetails = scoresMap[c.id] || { score: 0, skills: [] };

          return {
            id: c.id,
            name: c.name || 'Unknown',
            email: c.email || 'No email',
            exp: c.total_years_experience || 0,
            skills: matchDetails.skills.length > 0 ? matchDetails.skills : parsedSkills,
            score: matchDetails.score,
            status: c.status || 'new',
          };
        });

        setCandidates(mapped);
      } catch (err) {
        console.error('Error fetching compare candidates:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCandidates();
  }, [searchParams]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div className="spinner" style={{ width: 32, height: 32 }} />
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowX: 'auto', overflowY: 'auto', padding: 32 }}>
      {candidates.length < 2 ? (
        <EmptyState 
          icon="⚖️" 
          title="Select candidates to compare" 
          description="Select at least two candidates from the Candidates pool to compare their skills and experience side-by-side."
          action={
            <Link href="/candidates" className="btn btn-primary btn-sm">
              Go to Candidates
            </Link>
          }
        />
      ) : (
        <div style={{ display: 'flex', gap: 24, minWidth: 'min-content' }}>
          {/* Legend column */}
          <div style={{ width: 180, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 24, paddingTop: 140 }}>
            <div style={{ height: 40, fontWeight: 500, display: 'flex', alignItems: 'center', color: 'var(--text-secondary)' }}>Match Score</div>
            <div style={{ height: 40, fontWeight: 500, display: 'flex', alignItems: 'center', color: 'var(--text-secondary)' }}>Experience</div>
            <div style={{ height: 40, fontWeight: 500, display: 'flex', alignItems: 'center', color: 'var(--text-secondary)' }}>Status</div>
            <div style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>Top Skills</div>
          </div>

          {/* Candidate columns */}
          {candidates.map(c => (
            <div key={c.id} style={{ width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div className="card card-pad" style={{ height: 120, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative' }}>
                <button onClick={() => {
                  const newParams = new URLSearchParams(searchParams.toString());
                  const newIds = (newParams.get('ids') || '').split(',').filter(id => id !== c.id).join(',');
                  if (newIds) {
                    newParams.set('ids', newIds);
                  } else {
                    newParams.delete('ids');
                  }
                  window.history.replaceState({}, '', `${window.location.pathname}?${newParams.toString()}`);
                  setCandidates(prev => prev.filter(cand => cand.id !== c.id));
                }} aria-label={`Remove ${c.name} from comparison`} style={{ position: 'absolute', top: 8, right: 8, background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>×</button>
                <Avatar name={c.name} size={48} />
                <div style={{ fontWeight: 600, marginTop: 8, color: 'var(--text-primary)' }}>{c.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{c.email}</div>
              </div>

              <div style={{ height: 40, display: 'flex', alignItems: 'center', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ fontWeight: 600, fontSize: 16, color: 'var(--text-primary)' }}>{c.score}%</div>
                <ScoreBar score={c.score} height={4} />
              </div>

              <div style={{ height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)' }}>
                {c.exp} years
              </div>

              <div style={{ height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className={`badge ${c.status === 'offer' ? 'badge-green' : c.status === 'interview' ? 'badge-yellow' : 'badge-blue'}`}>
                  {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                </span>
              </div>

              <div className="card card-pad" style={{ flex: 1 }}>
                <SkillChips skills={c.skills} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div className="spinner" style={{ width: 32, height: 32 }} />
      </div>
    }>
      <div className="page" style={{ height: '100vh', display: 'flex', flexDirection: 'column', padding: 0 }}>
        <div style={{ padding: '24px 32px 16px', borderBottom: '1px solid var(--border)' }}>
          <div className="breadcrumb">HireIQ</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div>
              <h1 className="page-title">Compare Candidates</h1>
              <p className="page-desc" style={{ marginBottom: 0 }}>Side-by-side comparison of shortlisted applicants</p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  alert('Compare link copied to clipboard!');
                }}
              >
                🔗 Share shortlist
              </button>
              <Link href="/candidates" className="btn btn-secondary btn-sm">
                Add candidate
              </Link>
              <button className="btn btn-primary btn-sm">
                Export comparison
              </button>
            </div>
          </div>
        </div>

        <CompareContent />
      </div>
    </Suspense>
  );
}
