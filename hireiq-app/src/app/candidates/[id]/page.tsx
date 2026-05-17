'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';

interface ScoreEntry {
  id: string; match_score: number; skill_match_pct: number; semantic_similarity: number;
  matched_skills: string[]; missing_skills: string[]; bonus_skills: string[];
  score_reasoning: string; ai_summary?: string; scored_at: string;
  jobs: { id: string; title: string; department: string | null; seniority_level: string | null } | null;
}
interface Candidate {
  id: string; name: string | null; email: string | null; phone: string | null;
  location: string | null; total_years_experience: number | null;
  status: string; created_at: string; parsed_json: any;
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 70 ? '#3B6D11' : score >= 50 ? '#D97706' : '#DC2626';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 100, height: 6, background: '#F3F4F6', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${Math.min(score, 100)}%`, height: '100%', background: color, borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 500, color }}>{score}%</span>
    </div>
  );
}

export default function CandidateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params); // ✅ Next.js 16 fix

  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [scores, setScores]       = useState<ScoreEntry[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');

  useEffect(() => {
    fetch(`/api/candidates/${id}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) { setError(d.error); return; }
        setCandidate(d.candidate);
        setScores(d.scores || []);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="page">
      <div className="breadcrumb">HireIQ / Candidates</div>
      {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 14, marginBottom: 10, width: `${60 - i * 10}%` }} />)}
    </div>
  );
  if (error || !candidate) return (
    <div className="page"><div className="alert alert-error">{error || 'Candidate not found.'}</div></div>
  );

  const parsed: any = candidate.parsed_json || {};
  const skills: string[] = Array.isArray(parsed.skills) ? parsed.skills : [];
  const experience: any[] = Array.isArray(parsed.experience) ? parsed.experience : [];
  const education: any[]  = Array.isArray(parsed.education)  ? parsed.education  : [];
  const bestScore = scores.length > 0 ? Math.max(...scores.map(s => s.match_score)) : null;

  const statusBadge: Record<string, string> = {
    new: 'badge-gray', reviewing: 'badge-yellow', shortlisted: 'badge-green', rejected: 'badge-red',
  };

  return (
    <div className="page" style={{ maxWidth: 900 }}>
      <div className="breadcrumb">
        <Link href="/candidates" style={{ color: '#9CA3AF', textDecoration: 'none' }}>Candidates</Link> / {candidate.name || 'Unknown'}
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 className="page-title">{candidate.name || 'Unknown candidate'}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
            {candidate.email && <span style={{ fontSize: 13, color: '#6B7280' }}>{candidate.email}</span>}
            {candidate.location && <span style={{ fontSize: 13, color: '#9CA3AF' }}>· {candidate.location}</span>}
            <span className={`badge ${statusBadge[candidate.status] || 'badge-gray'}`}>{candidate.status || 'new'}</span>
          </div>
        </div>
        {bestScore !== null && (
          <div className="card card-pad" style={{ textAlign: 'center', minWidth: 100, flexShrink: 0 }}>
            <div className="stat-value" style={{ color: bestScore >= 70 ? '#3B6D11' : bestScore >= 50 ? '#D97706' : '#DC2626' }}>
              {bestScore}%
            </div>
            <div className="stat-label">Best match</div>
          </div>
        )}
      </div>

      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="card card-pad">
            <div className="section-title" style={{ marginBottom: 12 }}>Overview</div>
            {[
              { label: 'Phone',      value: candidate.phone },
              { label: 'Location',   value: candidate.location },
              { label: 'Experience', value: candidate.total_years_experience != null ? `${candidate.total_years_experience} years` : null },
              { label: 'Uploaded',   value: new Date(candidate.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) },
            ].filter(r => r.value).map(row => (
              <div key={row.label} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: '#9CA3AF', width: 80, flexShrink: 0 }}>{row.label}</span>
                <span style={{ fontSize: 13, color: '#374151' }}>{row.value}</span>
              </div>
            ))}
          </div>

          {skills.length > 0 && (
            <div className="card card-pad">
              <div className="section-title" style={{ marginBottom: 10 }}>Skills ({skills.length})</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {skills.map(s => <span key={s} className="skill-chip">{s}</span>)}
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {experience.length > 0 && (
            <div className="card card-pad">
              <div className="section-title" style={{ marginBottom: 10 }}>Experience</div>
              {experience.slice(0, 4).map((e, i) => (
                <div key={i} style={{ paddingBottom: 10, marginBottom: 10, borderBottom: i < Math.min(experience.length, 4) - 1 ? '1px solid #F3F4F6' : 'none' }}>
                  <div style={{ fontWeight: 500, fontSize: 13 }}>{e.title || e.company || '—'}</div>
                  {e.company && e.title && <div style={{ fontSize: 12, color: '#6B7280' }}>{e.company}</div>}
                  {e.duration && <div style={{ fontSize: 11, color: '#9CA3AF' }}>{e.duration}</div>}
                  {e.description && <p style={{ fontSize: 12, color: '#6B7280', marginTop: 4, lineHeight: 1.5 }}>{String(e.description).slice(0, 120)}{String(e.description).length > 120 ? '…' : ''}</p>}
                </div>
              ))}
            </div>
          )}
          {education.length > 0 && (
            <div className="card card-pad">
              <div className="section-title" style={{ marginBottom: 10 }}>Education</div>
              {education.map((e, i) => (
                <div key={i} style={{ marginBottom: i < education.length - 1 ? 8 : 0 }}>
                  <div style={{ fontWeight: 500, fontSize: 13 }}>{e.degree || '—'}</div>
                  {e.institution && <div style={{ fontSize: 12, color: '#6B7280' }}>{e.institution}</div>}
                  {e.year && <div style={{ fontSize: 11, color: '#9CA3AF' }}>{e.year}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="section-title">Match scores across jobs</div>
      {scores.length === 0 ? (
        <div className="card">
          <div className="empty-state" style={{ padding: '32px 24px' }}>
            <p className="empty-state-desc">No scores yet. Open a job and click <strong>Run AI scoring</strong>.</p>
            <Link href="/jobs" className="btn btn-primary btn-sm">View jobs</Link>
          </div>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Job</th>
                <th style={{ width: 160 }}>Match score</th>
                <th>Matched skills</th>
                <th>Missing skills</th>
                <th style={{ width: 90 }}>Scored</th>
                <th style={{ width: 90 }}></th>
              </tr>
            </thead>
            <tbody>
              {[...scores].sort((a, b) => b.match_score - a.match_score).map(s => {
                const job = s.jobs;
                return (
                  <tr key={s.id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{job?.title || '—'}</div>
                      {job?.department && <div style={{ fontSize: 11, color: '#9CA3AF' }}>{job.department}</div>}
                    </td>
                    <td><ScoreBar score={s.match_score} /></td>
                    <td>
                      {(s.matched_skills || []).slice(0, 4).map(sk => (
                        <span key={sk} className="skill-chip" style={{ background: '#EBF2E3', color: '#3B6D11', marginRight: 3 }}>{sk}</span>
                      ))}
                    </td>
                    <td>
                      {(s.missing_skills || []).slice(0, 3).map(sk => (
                        <span key={sk} className="skill-chip" style={{ background: '#FEF2F2', color: '#DC2626', marginRight: 3 }}>{sk}</span>
                      ))}
                    </td>
                    <td style={{ color: '#9CA3AF', fontSize: 11 }}>
                      {s.scored_at ? new Date(s.scored_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                    </td>
                    <td>
                      {job && <Link href={`/jobs/${job.id}`} className="btn btn-ghost btn-sm">View job</Link>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
