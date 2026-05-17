'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';

interface ScoreEntry {
  id: string; match_score: number; skill_match_pct: number;
  matched_skills: string[]; missing_skills: string[]; bonus_skills: string[];
  score_reasoning: string; semantic_similarity: number; scored_at: string;
  candidates: { id: string; name: string | null; email: string | null; total_years_experience: number | null; status: string } | null;
}
interface Job {
  id: string; title: string; department: string | null; seniority_level: string | null;
  required_skills: string[]; preferred_skills: string[]; summary: string | null; created_at: string;
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 70 ? '#3B6D11' : score >= 50 ? '#D97706' : '#DC2626';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 80, height: 6, background: '#F3F4F6', borderRadius: 3, overflow: 'hidden', flexShrink: 0 }}>
        <div style={{ width: `${Math.min(score, 100)}%`, height: '100%', background: color, borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 500, color, width: 36 }}>{score}%</span>
    </div>
  );
}

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: jobId } = use(params); // ✅ Next.js 16 fix

  const [job, setJob]                 = useState<Job | null>(null);
  const [leaderboard, setLeaderboard] = useState<ScoreEntry[]>([]);
  const [totalScored, setTotalScored] = useState(0);
  const [shortlisted, setShortlisted] = useState(0);
  const [loading, setLoading]         = useState(true);
  const [scoring, setScoring]         = useState(false);
  const [scoreMsg, setScoreMsg]       = useState<{ ok: boolean; text: string } | null>(null);
  const [expandedId, setExpandedId]   = useState<string | null>(null);
  const [questions, setQuestions]     = useState<Record<string, string[]>>({});
  const [loadingQ, setLoadingQ]       = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetch(`/api/jobs/${jobId}`)
      .then(r => r.json())
      .then(d => {
        setJob(d.job ?? null);
        setLeaderboard(d.leaderboard ?? []);
        setTotalScored(d.total_scored ?? 0);
        setShortlisted(d.shortlisted ?? 0);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [jobId]);

  const runScoring = async () => {
    setScoring(true); setScoreMsg(null);
    try {
      const r = await fetch('/api/score-all', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: jobId }),
      });
      const d = await r.json();
      if (!r.ok) {
        setScoreMsg({ ok: false, text: d.error || 'Scoring failed — is the AI backend running?' });
      } else {
        setScoreMsg({ ok: d.errors === 0, text: `Scored ${d.scored} candidate${d.scored !== 1 ? 's' : ''}${d.errors ? ` (${d.errors} errors)` : ''}. ≥70% are auto-shortlisted.` });
        load();
      }
    } catch (e: any) {
      setScoreMsg({ ok: false, text: e.message || 'Network error' });
    } finally {
      setScoring(false);
    }
  };

  const fetchQuestions = async (candidateId: string) => {
    if (questions[candidateId] !== undefined || loadingQ === candidateId) return;
    setLoadingQ(candidateId);
    try {
      const r = await fetch(`/api/interview-questions?candidate_id=${candidateId}&job_id=${jobId}`);
      const d = await r.json();
      setQuestions(prev => ({ ...prev, [candidateId]: d.questions || [] }));
    } catch { setQuestions(prev => ({ ...prev, [candidateId]: [] })); }
    finally { setLoadingQ(null); }
  };

  const toggle = (id: string) => {
    const next = expandedId === id ? null : id;
    setExpandedId(next);
    if (next) fetchQuestions(next);
  };

  if (loading) return (
    <div className="page">
      <div className="breadcrumb">HireIQ / Jobs</div>
      {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 16, marginBottom: 10, width: `${70 - i * 10}%` }} />)}
    </div>
  );
  if (!job) return <div className="page"><div className="alert alert-error">Job not found.</div></div>;

  return (
    <div className="page">
      <div className="breadcrumb">
        <Link href="/jobs" style={{ color: '#9CA3AF', textDecoration: 'none' }}>Jobs</Link> / {job.title}
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, gap: 16 }}>
        <div>
          <h1 className="page-title">{job.title}</h1>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
            {job.department && <span style={{ fontSize: 13, color: '#6B7280' }}>{job.department}</span>}
            {job.seniority_level && <span className="badge badge-gray">{job.seniority_level}</span>}
          </div>
          {job.summary && <p style={{ fontSize: 13, color: '#6B7280', marginTop: 8, maxWidth: 600, lineHeight: 1.6 }}>{job.summary}</p>}
        </div>
        <button className="btn btn-primary" onClick={runScoring} disabled={scoring} style={{ minWidth: 150, flexShrink: 0 }}>
          {scoring ? 'Scoring…' : '⚡ Run AI scoring'}
        </button>
      </div>

      {scoreMsg && (
        <div className={`alert ${scoreMsg.ok ? 'alert-success' : 'alert-warning'}`} style={{ marginBottom: 20 }}>
          {scoreMsg.text}
        </div>
      )}

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

      {(job.required_skills || []).length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div className="section-title">Required skills</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {job.required_skills.map(s => <span key={s} className="skill-chip" style={{ background: '#EBF2E3', color: '#3B6D11' }}>{s}</span>)}
          </div>
        </div>
      )}

      <div className="section-title">
        Candidate leaderboard
        {totalScored > 0 && <span style={{ fontSize: 11, fontWeight: 400, color: '#9CA3AF', marginLeft: 6 }}>click row to expand</span>}
      </div>

      {leaderboard.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <p className="empty-state-desc">No scores yet. Click <strong>Run AI scoring</strong> above.</p>
          </div>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 36 }}>#</th>
                <th>Candidate</th>
                <th style={{ width: 160 }}>Match score</th>
                <th>Matched</th>
                <th>Missing</th>
                <th style={{ width: 110 }}>Status</th>
                <th style={{ width: 80 }}></th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry, idx) => {
                const cand = entry.candidates;
                if (!cand) return null;
                const isOpen = expandedId === cand.id;
                return (
                  <>
                    <tr key={entry.id} style={{ cursor: 'pointer' }} onClick={() => toggle(cand.id)}>
                      <td style={{ color: '#9CA3AF', fontSize: 12 }}>{idx + 1}</td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{cand.name || 'Unknown'}</div>
                        {cand.email && <div style={{ fontSize: 11, color: '#9CA3AF' }}>{cand.email}</div>}
                      </td>
                      <td><ScoreBar score={entry.match_score} /></td>
                      <td>
                        {(entry.matched_skills || []).slice(0, 4).map(s => (
                          <span key={s} className="skill-chip" style={{ background: '#EBF2E3', color: '#3B6D11', marginRight: 3 }}>{s}</span>
                        ))}
                      </td>
                      <td>
                        {(entry.missing_skills || []).slice(0, 3).map(s => (
                          <span key={s} className="skill-chip" style={{ background: '#FEF2F2', color: '#DC2626', marginRight: 3 }}>{s}</span>
                        ))}
                      </td>
                      <td>
                        {entry.match_score >= 70
                          ? <span className="badge badge-green">Shortlisted</span>
                          : <span className="badge badge-gray">{cand.status || 'new'}</span>}
                      </td>
                      <td onClick={e => e.stopPropagation()}>
                        <Link href={`/candidates/${cand.id}`} className="btn btn-ghost btn-sm" onClick={e => e.stopPropagation()}>
                          Profile
                        </Link>
                      </td>
                    </tr>
                    {isOpen && (
                      <tr key={`${entry.id}-open`}>
                        <td colSpan={7} style={{ background: '#FAFAFA', padding: '16px 20px' }}>
                          <div className="grid-2" style={{ gap: 20 }}>
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 8 }}>Score breakdown</div>
                              {[
                                ['Match score', `${entry.match_score}%`],
                                ['Semantic similarity', `${entry.semantic_similarity ?? '—'}%`],
                                ['Skill overlap', `${entry.skill_match_pct ?? '—'}%`],
                                ['Experience', cand.total_years_experience ? `${cand.total_years_experience}y` : '—'],
                              ].map(([k, v]) => (
                                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6B7280', marginBottom: 4 }}>
                                  <span>{k}</span><strong style={{ color: '#374151' }}>{v}</strong>
                                </div>
                              ))}
                              {entry.score_reasoning && (
                                <div style={{ marginTop: 8, padding: '8px 10px', background: '#F9FAFB', borderRadius: 4, border: '1px solid #E5E7EB', fontSize: 12, lineHeight: 1.5 }}>
                                  {entry.score_reasoning}
                                </div>
                              )}
                            </div>
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 8 }}>
                                Interview questions
                                {loadingQ === cand.id && <span style={{ color: '#9CA3AF', fontWeight: 400, marginLeft: 6 }}>Generating…</span>}
                              </div>
                              {questions[cand.id] !== undefined ? (
                                questions[cand.id].length > 0
                                  ? <ol style={{ paddingLeft: 16, margin: 0 }}>
                                      {questions[cand.id].map((q, i) => <li key={i} style={{ fontSize: 12, marginBottom: 6, lineHeight: 1.5 }}>{q}</li>)}
                                    </ol>
                                  : <p style={{ fontSize: 12, color: '#9CA3AF' }}>Could not generate — is AI backend running?</p>
                              ) : loadingQ === cand.id
                                ? [...Array(5)].map((_, i) => <div key={i} className="skeleton" style={{ height: 11, marginBottom: 6 }} />)
                                : <p style={{ fontSize: 12, color: '#9CA3AF' }}>Run scoring first.</p>}
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
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
