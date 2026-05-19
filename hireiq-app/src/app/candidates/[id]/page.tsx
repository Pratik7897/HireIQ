'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { use } from 'react';
import { fmtDate, fmtRelative, scoreColor, scoreBadgeClass, statusLabel, statusBadgeClass } from '@/lib/utils';
import { Avatar, ScoreBar, SkillChips, EmptyState, Spinner, Tooltip } from '@/components/ui/Primitives';
import { CopyButton } from '@/components/ui/CopyButton';
import { EmailTemplateModal } from '@/components/ui/EmailTemplateModal';

interface Experience {
  company: string; title: string; duration: string; description: string;
}
interface Education {
  degree: string; institution: string; year: string;
}
interface ParsedResume {
  name: string; email: string; phone: string; location: string;
  skills: string[]; experience: Experience[]; education: Education[];
  total_years_experience: number; _source?: string;
}

interface CandidateScore {
  id: string; job_id: string; job_title?: string; match_score: number;
  matched_skills: string[]; missing_skills: string[]; score_reasoning: string;
  ai_summary: string | null; scored_at: string;
}

interface BiasFlag {
  id: string; flag_type: string; flag_text: string;
  severity: 'low' | 'medium' | 'high'; guidance: string;
}

interface Candidate {
  id: string; name: string | null; email: string | null; phone: string | null;
  location: string | null; total_years_experience: number | null;
  file_name: string | null; file_url: string | null;
  parsed_json: ParsedResume | null; created_at: string; status?: string;
}

type Tab = 'overview' | 'scores' | 'bias' | 'activity';

export default function CandidateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [scores, setScores] = useState<CandidateScore[]>([]);
  const [bias, setBias] = useState<BiasFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('overview');
  const [notFound, setNotFound] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/candidates/${id}`).then(r => r.json()),
      fetch(`/api/candidates/${id}/scores`).then(r => r.json()).catch(() => ({ scores: [] })),
      fetch(`/api/candidates/${id}/bias`).then(r => r.json()).catch(() => ({ flags: [] })),
    ]).then(([cData, sData, bData]) => {
      if (cData.error || !cData.candidate) { setNotFound(true); }
      else {
        setCandidate(cData.candidate);
        setScores(sData.scores || []);
        setBias(bData.flags || []);
      }
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <Spinner size={24} />
      </div>
    );
  }

  if (notFound || !candidate) {
    return (
      <div className="page">
        <EmptyState title="Candidate not found" description="This candidate may have been removed." icon="🔍" />
      </div>
    );
  }

  const parsed = candidate.parsed_json;
  const skills = parsed?.skills || [];
  const experience = parsed?.experience || [];
  const education = parsed?.education || [];
  const bestScore = scores.length ? Math.max(...scores.map(s => s.match_score)) : null;

  const SEVERITY_COLORS: Record<string, string> = {
    high: '#DC2626', medium: '#B45309', low: '#3B6D11',
  };

  return (
    <div className="page">
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <Link href="/candidates" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Candidates</Link>
        {' / '}
        {candidate.name || 'Unknown'}
      </div>

      {/* Profile header */}
      <div className="card card-pad" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <Avatar name={candidate.name} size={52} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
              <h1 className="page-title" style={{ marginBottom: 0 }}>
                {candidate.name || 'Unknown candidate'}
              </h1>
              {candidate.status && (
                <span className={`badge ${statusBadgeClass(candidate.status)}`}>
                  {statusLabel(candidate.status)}
                </span>
              )}
              {bestScore !== null && (
                <span className={`badge ${scoreBadgeClass(bestScore)}`}>
                  Best score: {bestScore}%
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13, color: 'var(--text-secondary)' }}>
              {candidate.email && <span>✉ {candidate.email}</span>}
              {candidate.phone && <span>📞 {candidate.phone}</span>}
              {candidate.location && <span>📍 {candidate.location}</span>}
              {candidate.total_years_experience != null && (
                <span>🕐 {candidate.total_years_experience}y experience</span>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            {candidate.email && (
              <button onClick={() => setEmailModalOpen(true)} className="btn btn-secondary btn-sm">
                ✉ Email
              </button>
            )}
            <Link href={`/interviews?candidate=${candidate.id}`} className="btn btn-primary btn-sm">
              Schedule
            </Link>
            {candidate.file_url && (
              <a
                href={candidate.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary btn-sm"
              >
                ↓ Resume
              </a>
            )}
            <Link href="/candidates" className="btn btn-ghost btn-sm">
              ← Back
            </Link>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {(['overview', 'scores', 'bias', 'activity'] as Tab[]).map(t => (
          <button
            key={t}
            className={`tab-item ${tab === t ? 'active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t === 'overview' && 'Overview'}
            {t === 'scores' && `Scores${scores.length ? ` (${scores.length})` : ''}`}
            {t === 'bias' && `Bias flags${bias.length ? ` (${bias.length})` : ''}`}
            {t === 'activity' && 'Activity'}
          </button>
        ))}
      </div>

      {/* ─── Overview tab ─── */}
      {tab === 'overview' && (
        <div className="grid-2" style={{ alignItems: 'start' }}>
          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Skills */}
            <div>
              <div className="section-title">Skills</div>
              <div className="card card-pad">
                {skills.length === 0 ? (
                  <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No skills extracted.</p>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {skills.map(s => (
                      <span key={s} className="skill-chip">{s}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Contact / meta */}
            <div>
              <div className="section-title">Details</div>
              <div className="card">
                <div className="info-row">
                  <span className="info-label">Email</span>
                  <span className="info-value" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {candidate.email || '—'}
                    {candidate.email && <CopyButton text={candidate.email} label="Email" />}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Phone</span>
                  <span className="info-value" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {candidate.phone || '—'}
                    {candidate.phone && <CopyButton text={candidate.phone} label="Phone number" />}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Location</span>
                  <span className="info-value">{candidate.location || '—'}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Experience</span>
                  <span className="info-value">
                    {candidate.total_years_experience != null
                      ? `${candidate.total_years_experience} years`
                      : '—'}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Resume file</span>
                  <span className="info-value" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {candidate.file_name || '—'}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Uploaded</span>
                  <span className="info-value">{fmtDate(candidate.created_at)}</span>
                </div>
                {parsed?._source && (
                  <div className="info-row">
                    <span className="info-label">Parsed by</span>
                    <span className="info-value">
                      <span className="badge badge-gray">{parsed._source}</span>
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Experience */}
            <div>
              <div className="section-title">Experience</div>
              <div className="card card-pad">
                {experience.length === 0 ? (
                  <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No experience extracted.</p>
                ) : (
                  <div className="timeline">
                    {experience.map((exp, i) => (
                      <div key={i} className="timeline-item">
                        <div style={{ position: 'relative' }}>
                          <div className="timeline-dot" />
                          {i < experience.length - 1 && <div className="timeline-line" />}
                        </div>
                        <div style={{ flex: 1, paddingBottom: 4 }}>
                          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
                            {exp.title || '—'}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--accent)', marginBottom: 2 }}>
                            {exp.company}
                          </div>
                          {exp.duration && (
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{exp.duration}</div>
                          )}
                          {exp.description && (
                            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.6 }}>
                              {exp.description.slice(0, 200)}
                              {exp.description.length > 200 ? '…' : ''}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Education */}
            <div>
              <div className="section-title">Education</div>
              <div className="card card-pad">
                {education.length === 0 ? (
                  <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No education extracted.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {education.map((edu, i) => (
                      <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: 6, background: 'var(--accent-light)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 14, flexShrink: 0,
                        }}>
                          🎓
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 500 }}>{edu.degree || '—'}</div>
                          <div style={{ fontSize: 12, color: 'var(--accent)' }}>{edu.institution}</div>
                          {edu.year && (
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{edu.year}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Scores tab ─── */}
      {tab === 'scores' && (
        <div>
          {scores.length === 0 ? (
            <div className="card">
              <EmptyState
                icon="📊"
                title="No scores yet"
                description="Score this candidate against a job description to see match results."
                action={<Link href="/jobs" className="btn btn-primary btn-sm">View jobs</Link>}
              />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {scores.map(score => (
                <div key={score.id} className="card card-pad">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>
                        {score.job_title || `Job ${score.job_id.slice(0, 8)}`}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        Scored {fmtRelative(score.scored_at)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ fontSize: 24, fontWeight: 600, color: scoreColor(score.match_score) }}>
                        {score.match_score}%
                      </div>
                      <span className={`badge ${scoreBadgeClass(score.match_score)}`}>
                        {score.match_score >= 80 ? 'Excellent' : score.match_score >= 60 ? 'Good' : score.match_score >= 40 ? 'Fair' : 'Low'}
                      </span>
                    </div>
                  </div>
                  <ScoreBar score={score.match_score} height={6} />
                  {score.score_reasoning && (
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 10, lineHeight: 1.6 }}>
                      {score.score_reasoning}
                    </p>
                  )}
                  {score.ai_summary && (
                    <div style={{
                      background: '#F9FAFB', borderRadius: 6, padding: 12,
                      marginTop: 10, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.7,
                    }}>
                      {score.ai_summary}
                    </div>
                  )}
                  <div className="grid-2" style={{ marginTop: 12, gap: 12 }}>
                    {score.matched_skills.length > 0 && (
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
                          ✓ Matched skills ({score.matched_skills.length})
                        </div>
                        <SkillChips skills={score.matched_skills} max={8} />
                      </div>
                    )}
                    {score.missing_skills.length > 0 && (
                      <div>
                        <div style={{ fontSize: 11, color: '#DC2626', marginBottom: 4 }}>
                          ✕ Missing skills ({score.missing_skills.length})
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                          {score.missing_skills.slice(0, 8).map(s => (
                            <Tooltip key={s} text="Required skill missing from resume">
                              <span className="skill-chip" style={{ background: '#FEF2F2', color: '#DC2626', cursor: 'help' }}>
                                {s}
                              </span>
                            </Tooltip>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Bias tab ─── */}
      {tab === 'bias' && (
        <div>
          {bias.length === 0 ? (
            <div className="card">
              <EmptyState
                icon="✅"
                title="No bias flags"
                description="No bias indicators were found in this resume."
              />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div className="alert alert-warning" style={{ marginBottom: 8 }}>
                <span>⚠</span>
                <span>{bias.length} potential bias indicator{bias.length > 1 ? 's' : ''} detected. Review and address before proceeding.</span>
              </div>
              {bias.map((flag, i) => (
                <div key={flag.id || i} className="card card-pad">
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div
                      style={{
                        width: 8, height: 8, borderRadius: '50%', flexShrink: 0, marginTop: 5,
                        background: SEVERITY_COLORS[flag.severity] || '#9CA3AF',
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 500 }}>
                          {flag.flag_type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                        </span>
                        <span className={`badge ${flag.severity === 'high' ? 'badge-red' : flag.severity === 'medium' ? 'badge-yellow' : 'badge-gray'}`}>
                          {flag.severity}
                        </span>
                      </div>
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>
                        {flag.flag_text}
                      </p>
                      <div style={{
                        background: '#F9FAFB', borderRadius: 4, padding: '6px 10px',
                        fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6,
                      }}>
                        💡 {flag.guidance}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Activity tab ─── */}
      {tab === 'activity' && (
        <div className="card">
          <EmptyState
            icon="📋"
            title="Activity log"
            description="Candidate activity history will appear here."
          />
        </div>
      )}

      <EmailTemplateModal
        open={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        candidateName={candidate.name || 'Candidate'}
        candidateEmail={candidate.email || ''}
        defaultType="interview"
      />
    </div>
  );
}
