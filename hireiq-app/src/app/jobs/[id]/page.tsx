'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface ScoreEntry {
  id: string; match_score: number; skill_match_pct: number;
  matched_skills: string[]; missing_skills: string[];
  bonus_skills: string[]; score_reasoning: string; semantic_similarity: number;
  ai_summary?: string; scored_at: string;
  candidates: { id: string; name: string | null; email: string | null; location: string | null; total_years_experience: number | null; status: string };
}
interface Job {
  id: string; title: string; department: string | null; seniority_level: string | null;
  required_skills: string[]; preferred_skills: string[]; summary: string | null; created_at: string;
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 70 ? '#3B6D11' : score >= 50 ? '#D97706' : '#DC2626';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: '#F3F4F6', borderRadius: 3, overflow: 'hidden', maxWidth: 80 }}>
        <div style={{ width: `${score}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.4s' }} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 500, color, width: 36, textAlign: 'right' }}>{score}%</span>
    </div>
  );
}

export default function JobDetailPage({ params }: { params: { id: string } }) {
  const [job, setJob]               = useState<Job | null>(null);
  const [leaderboard, setLeaderboard] = useState<ScoreEntry[]>([]);
  const [totalScored, setTotalScored] = useState(0);
  const [shortlisted, setShortlisted] = useState(0);
  const [loading, setLoading]       = useState(true);
  const [scoring, setScoring]       = useState(false);
  const [scoreResult, setScoreResult] = useState<{ scored: number; errors: number } | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [questions, setQuestions]   = useState<{ [key: string]: string[] }>({});
  const [loadingQ, setLoadingQ]     = useState<string | null>(null);

  const fetchData = () => {
    setLoading(true);
    fetch(`/api/jobs/${params.id}`)
      .then(r => r.json())
      .then(d => {
        setJob(d.job);
        setLeaderboard(d.leaderboard || []);
        setTotalScored(d.total_scored || 0);
        setShortlisted(d.shortlisted || 0);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [params.id]);

  const runScoring = async () => {
    setScoring(true);
    setScoreResult(null);
    try {
      const r = await fetch('/api/score-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: params.id }),
      });
      const d = await r.json();
      setScoreResult({ scored: d.scored, errors: d.errors });
      fetchData(); // reload leaderboard
    } finally {
      setScoring(false);
    }
  };

  const loadQuestions = async (candidateId: string) => {
    if (questions[candidateId]) return;
    setLoadingQ(candidateId);
    try {
      const r = await fetch(`/api/interview-questions?candidate_id=${candidateId}&job_id=${params.id}`);
      const d = await r.json();
      setQuestions(q => ({ ...q, [candidateId]: d.questions || [] }));
    } finally {
      setLoadingQ(null);
    }
  };

  const toggleRow = (candidateId: string) => {
    const next = expandedRow === candidateId ? null : candidateId;
    setExpandedRow(next);
    if (next) loadQuestions(next);
  };

  if (loading) return (
    <div className="page">
      <div className="breadcrumb">HireIQ / Jobs</div>
      <div className="skeleton" style={{ height: 22, width: 280, marginBottom: 20 }} />
      <div className="grid-4" style={{ marginBottom: 24 }}>
        {[...Array(4)].map((_, i) => <div key={i} className="card card-pad"><div className="skeleton" style={{ height: 28, width: 50, marginBottom: 8 }} /><div className="skeleton" style={{ height: 12, width: 80 }} /></div>)}
      </div>
    </div>
  );

  if (!job) return (
    <div className="page">
      <div className="alert alert-error">Job not found.</div>
    </div>
  );

  return (
    <div className="page">
      <div className="breadcrumb">
        <Link href="/jobs" style={{ color: '#9CA3AF', textDecoration: 'none' }}>Jobs</Link>
        {' / '}{job.title}
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, gap: 16 }}>
        <div>
          <h1 className="page-title">{job.title}</h1>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
            {job.department && <span style={{ fontSize: 13, color: '#6B7280' }}>{job.department}</span>}
            {job.seniority_level && <span className="badge badge-gray">{job.seniority_level}</span>}
          </div>
          {job.summary && (
            <p style={{ fontSize: 13, color: '#6B7280', marginTop: 8, maxWidth: 600, lineHeight: 1.6 }}>{job.summary}</p>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          {scoring ? (
            <button className="btn btn-primary" disabled>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}><circle cx="12" cy="12" r="10" strokeOpacity="0.3"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>
              Scoring all candidates…
            </button>
          ) : (
            <button className="btn btn-primary" onClick={runScoring}>
              ⚡ Run AI scoring
            </button>
          )}
        </div>
      </div>

      {/* Score result banner */}
      {scoreResult && (
        <div className={`alert ${scoreResult.errors === 0 ? 'alert-success' : 'alert-warning'}`} style={{ marginBottom: 20 }}>
          Scored {scoreResult.scored} candidate{scoreResult.scored !== 1 ? 's' : ''}.
          {scoreResult.errors > 0 && ` ${scoreResult.errors} error(s) — check if the AI backend is running.`}
          {' '}Candidates with ≥70% are automatically shortlisted.
        </div>
      )}

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        {[
          { label: 'Candidates scored', value: totalScored },
          { label: 'Shortlisted (≥70%)', value: shortlisted },
          { label: 'Required skills', value: (job.required_skills || []).length },
          { label: 'Preferred skills', value: (job.preferred_skills || []).length },
        ].map(s => (
          <div key={s.label} className="card card-pad">
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Required skills */}
      {(job.required_skills || []).length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div className="section-title">Required skills</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {job.required_skills.map(s => (
              <span key={s} className="skill-chip" style={{ background: '#EBF2E3', color: '#3B6D11' }}>{s}</span>
            ))}
          </div>
        </div>
      )}

      {/* Leaderboard */}
      <div className="section-title">
        Candidate leaderboard
        {totalScored > 0 && (
          <span style={{ fontSize: 11, fontWeight: 400, color: '#9CA3AF', marginLeft: 6 }}>ranked by match score</span>
        )}
      </div>

      {leaderboard.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <p className="empty-state-desc">
              No scores yet. Click <strong>Run AI scoring</strong> to score all candidates against this job description.
            </p>
            <button className="btn btn-primary" onClick={runScoring} disabled={scoring}>
              {scoring ? 'Scoring…' : '⚡ Run AI scoring'}
            </button>
          </div>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 32 }}>#</th>
                <th>Candidate</th>
                <th>Match score</th>
                <th>Matched skills</th>
                <th>Missing</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry, idx) => {
                const cand = entry.candidates;
                const isExpanded = expandedRow === cand.id;
                const isShortlisted = entry.match_score >= 70;

                return (
                  <>
                    <tr
                      key={entry.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => toggleRow(cand.id)}
                    >
                      <td style={{ color: '#9CA3AF', fontSize: 12 }}>{idx + 1}</td>
                      <td>
                        <div style={{ fontWeight: 500, fontSize: 13 }}>{cand.name || 'Unknown'}</div>
                        {cand.email && <div style={{ fontSize: 11, color: '#9CA3AF' }}>{cand.email}</div>}
                      </td>
                      <td>
                        <ScoreBar score={entry.match_score} />
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                          {(entry.matched_skills || []).slice(0, 4).map(s => (
                            <span key={s} className="skill-chip" style={{ background: '#EBF2E3', color: '#3B6D11' }}>{s}</span>
                          ))}
                          {(entry.matched_skills || []).length > 4 && (
                            <span className="skill-chip">+{(entry.matched_skills || []).length - 4}</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                          {(entry.missing_skills || []).slice(0, 3).map(s => (
                            <span key={s} className="skill-chip" style={{ background: '#FEF2F2', color: '#DC2626' }}>{s}</span>
                          ))}
                          {(entry.missing_skills || []).length > 3 && (
                            <span className="skill-chip" style={{ color: '#DC2626' }}>+{(entry.missing_skills || []).length - 3}</span>
                          )}
                        </div>
                      </td>
                      <td>
                        {isShortlisted
                          ? <span className="badge badge-green">Shortlisted</span>
                          : <span className="badge badge-gray">{cand.status || 'Reviewing'}</span>}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <Link
                            href={`/candidates/${cand.id}`}
                            className="btn btn-ghost btn-sm"
                            onClick={e => e.stopPropagation()}
                          >Profile</Link>
                          <span style={{ fontSize: 12, color: '#9CA3AF', display: 'flex', alignItems: 'center' }}>
                            {isExpanded ? '▲' : '▼'}
                          </span>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded row — skill breakdown + interview questions */}
                    {isExpanded && (
                      <tr key={`${entry.id}-exp`} style={{ background: '#FAFAFA' }}>
                        <td colSpan={7} style={{ padding: '16px 20px', background: '#FAFAFA', borderBottom: '1px solid #E5E7EB' }}>
                          <div className="grid-2" style={{ gap: 16 }}>
                            {/* Score breakdown */}
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 8 }}>Score breakdown</div>
                              <div style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.8 }}>
                                <div><strong>Match score:</strong> {entry.match_score}%</div>
                                <div><strong>Semantic similarity:</strong> {entry.semantic_similarity ?? '—'}%</div>
                                <div><strong>Skill overlap:</strong> {entry.skill_match_pct ?? '—'}%</div>
                                {cand.total_years_experience != null && (
                                  <div><strong>Experience:</strong> {cand.total_years_experience} years</div>
                                )}
                                {entry.score_reasoning && (
                                  <div style={{ marginTop: 6, padding: '8px 10px', background: '#F9FAFB', borderRadius: 4, border: '1px solid #E5E7EB' }}>
                                    {entry.score_reasoning}
                                  </div>
                                )}
                              </div>

                              {(entry.bonus_skills || []).length > 0 && (
                                <div style={{ marginTop: 10 }}>
                                  <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 4 }}>Bonus skills</div>
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                                    {entry.bonus_skills.map(s => (
                                      <span key={s} className="skill-chip" style={{ background: '#EFF6FF', color: '#2563EB' }}>{s}</span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Interview questions */}
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 8 }}>
                                Interview questions
                                {loadingQ === cand.id && (
                                  <span style={{ fontSize: 11, color: '#9CA3AF', marginLeft: 6 }}>Generating…</span>
                                )}
                              </div>
                              {questions[cand.id] ? (
                                <ol style={{ paddingLeft: 16, margin: 0 }}>
                                  {questions[cand.id].map((q, qi) => (
                                    <li key={qi} style={{ fontSize: 12, color: '#374151', marginBottom: 6, lineHeight: 1.5 }}>{q}</li>
                                  ))}
                                </ol>
                              ) : loadingQ === cand.id ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                  {[...Array(5)].map((_, i) => <div key={i} className="skeleton" style={{ height: 12 }} />)}
                                </div>
                              ) : (
                                <p style={{ fontSize: 12, color: '#9CA3AF' }}>Score this candidate first to generate questions.</p>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
