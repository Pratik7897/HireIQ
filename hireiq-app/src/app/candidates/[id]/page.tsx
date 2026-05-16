'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  Clock,
  FileText,
  Star,
  AlertTriangle,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { Candidate, CandidateScore, BiasFlag } from '@/lib/supabase';
import { formatDate, getBiasBg } from '@/lib/utils';

interface CandidateDetailData {
  candidate: Candidate;
  scores: (CandidateScore & { jobs: { title: string; department: string } })[];
  biasFlags: BiasFlag[];
}

export default function CandidateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<CandidateDetailData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/candidates/${params.id}`);
        const json = await res.json();
        if (json.candidate) setData(json);
        else router.push('/candidates');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.id]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-96">
        <Loader2 size={32} className="animate-spin" style={{ color: 'var(--accent)' }} />
      </div>
    );
  }

  if (!data) return null;

  const { candidate, scores, biasFlags } = data;
  const parsed = candidate.parsed_json;
  const overallRisk = biasFlags.length > 0
    ? (biasFlags.some((f) => f.severity === 'high') ? 'high' : biasFlags.some((f) => f.severity === 'medium') ? 'medium' : 'low')
    : 'low';

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 mb-6 text-sm"
        style={{
          color: 'var(--text-secondary)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        <ArrowLeft size={16} />
        Back to Candidates
      </button>

      {/* Header */}
      <div className="glass-card p-6 mb-6 animate-slide-up">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #2e86ab, #7c3aed)' }}
            >
              {(candidate.name || 'U')[0].toUpperCase()}
            </div>
            <div>
              <h1
                className="text-2xl font-bold mb-1"
                style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', color: 'var(--text-primary)' }}
              >
                {candidate.name || 'Unknown Candidate'}
              </h1>
              <div
                className="flex flex-wrap items-center gap-4 text-sm"
                style={{ color: 'var(--text-secondary)' }}
              >
                {candidate.email && (
                  <span className="flex items-center gap-1.5">
                    <Mail size={13} /> {candidate.email}
                  </span>
                )}
                {candidate.phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone size={13} /> {candidate.phone}
                  </span>
                )}
                {candidate.location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin size={13} /> {candidate.location}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Clock size={13} /> Uploaded {formatDate(candidate.uploaded_at)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Bias badge */}
            <div
              className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5`}
              style={{
                background:
                  overallRisk === 'low'
                    ? 'rgba(16,185,129,0.15)'
                    : overallRisk === 'medium'
                    ? 'rgba(245,158,11,0.15)'
                    : 'rgba(244,63,94,0.15)',
                color:
                  overallRisk === 'low'
                    ? '#10b981'
                    : overallRisk === 'medium'
                    ? '#f59e0b'
                    : '#f43f5e',
                border: `1px solid ${
                  overallRisk === 'low'
                    ? 'rgba(16,185,129,0.3)'
                    : overallRisk === 'medium'
                    ? 'rgba(245,158,11,0.3)'
                    : 'rgba(244,63,94,0.3)'
                }`,
              }}
            >
              <AlertTriangle size={11} />
              Bias: {overallRisk.charAt(0).toUpperCase() + overallRisk.slice(1)} Risk
            </div>

            {candidate.total_years_experience != null && (
              <div
                className="px-3 py-1.5 rounded-full text-xs font-semibold"
                style={{
                  background: 'rgba(124,58,237,0.15)',
                  color: '#a78bfa',
                  border: '1px solid rgba(124,58,237,0.3)',
                }}
              >
                {candidate.total_years_experience}y experience
              </div>
            )}

            {candidate.file_url && (
              <a
                href={candidate.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost text-xs"
              >
                <ExternalLink size={13} />
                View Resume
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left column */}
        <div className="col-span-2 space-y-5">
          {/* Skills */}
          {parsed?.skills && parsed.skills.length > 0 && (
            <div className="glass-card p-5 animate-slide-up">
              <h2 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Star size={15} style={{ color: 'var(--accent)' }} />
                Skills ({parsed.skills.length})
              </h2>
              <div className="flex flex-wrap gap-2">
                {parsed.skills.map((skill: string) => (
                  <span key={skill} className="skill-tag skill-tag-blue">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Experience */}
          {parsed?.experience && parsed.experience.length > 0 && (
            <div className="glass-card p-5 animate-slide-up">
              <h2 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Briefcase size={15} style={{ color: 'var(--accent)' }} />
                Work Experience
              </h2>
              <div className="space-y-4">
                {parsed.experience.map(
                  (
                    exp: { company: string; title: string; duration: string; description: string },
                    i: number
                  ) => (
                    <div key={i} className="flex gap-4">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: 'rgba(46,134,171,0.15)', border: '1px solid rgba(46,134,171,0.2)' }}
                      >
                        <Briefcase size={13} style={{ color: 'var(--accent)' }} />
                      </div>
                      <div>
                        <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                          {exp.title}
                        </div>
                        <div className="text-xs mb-1" style={{ color: 'var(--accent-light)' }}>
                          {exp.company} · {exp.duration}
                        </div>
                        {exp.description && (
                          <div className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                            {exp.description}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {/* Education */}
          {parsed?.education && parsed.education.length > 0 && (
            <div className="glass-card p-5 animate-slide-up">
              <h2 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <GraduationCap size={15} style={{ color: 'var(--accent)' }} />
                Education
              </h2>
              <div className="space-y-3">
                {parsed.education.map(
                  (
                    edu: { degree: string; institution: string; year: string },
                    i: number
                  ) => (
                    <div key={i} className="flex gap-3 items-start">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.2)' }}
                      >
                        <GraduationCap size={13} style={{ color: '#a78bfa' }} />
                      </div>
                      <div>
                        <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                          {edu.degree}
                        </div>
                        <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                          {edu.institution} · {edu.year}
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {/* Bias Flags */}
          {biasFlags.length > 0 && (
            <div className="glass-card p-5 animate-slide-up">
              <h2 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <AlertTriangle size={15} style={{ color: '#f59e0b' }} />
                Bias Analysis ({biasFlags.length} flag{biasFlags.length !== 1 ? 's' : ''})
              </h2>
              <div className="space-y-3">
                {biasFlags.map((flag) => (
                  <div
                    key={flag.id}
                    className="p-3 rounded-xl"
                    style={{
                      background:
                        flag.severity === 'low'
                          ? 'rgba(16,185,129,0.05)'
                          : flag.severity === 'medium'
                          ? 'rgba(245,158,11,0.05)'
                          : 'rgba(244,63,94,0.05)',
                      border: `1px solid ${
                        flag.severity === 'low'
                          ? 'rgba(16,185,129,0.2)'
                          : flag.severity === 'medium'
                          ? 'rgba(245,158,11,0.2)'
                          : 'rgba(244,63,94,0.2)'
                      }`,
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {flag.flag_type.replace(/_/g, ' ').toUpperCase()}
                      </span>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          background:
                            flag.severity === 'low'
                              ? 'rgba(16,185,129,0.15)'
                              : flag.severity === 'medium'
                              ? 'rgba(245,158,11,0.15)'
                              : 'rgba(244,63,94,0.15)',
                          color:
                            flag.severity === 'low'
                              ? '#10b981'
                              : flag.severity === 'medium'
                              ? '#f59e0b'
                              : '#f43f5e',
                        }}
                      >
                        {flag.severity}
                      </span>
                    </div>
                    <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
                      {flag.flag_text}
                    </p>
                    {flag.guidance && (
                      <p className="text-xs italic" style={{ color: 'var(--text-muted)' }}>
                        💡 {flag.guidance}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* File info */}
          <div className="glass-card p-4 animate-slide-up">
            <h3 className="text-xs font-semibold mb-3 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
              File Details
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FileText size={14} style={{ color: 'var(--accent)' }} />
                <span className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                  {candidate.file_name || 'Unknown file'}
                </span>
              </div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Uploaded: {formatDate(candidate.uploaded_at)}
              </div>
            </div>
          </div>

          {/* Scores */}
          {scores.length > 0 && (
            <div className="glass-card p-4 animate-slide-up">
              <h3 className="text-xs font-semibold mb-3 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                Match Scores
              </h3>
              <div className="space-y-3">
                {scores.map((score) => (
                  <div key={score.id}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {score.jobs?.title || 'Job'}
                      </span>
                      <span
                        className="text-sm font-bold"
                        style={{
                          color:
                            score.match_score >= 80
                              ? '#10b981'
                              : score.match_score >= 60
                              ? '#f59e0b'
                              : '#f43f5e',
                        }}
                      >
                        {score.match_score}%
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-bar-fill"
                        style={{ width: `${score.match_score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No scores yet */}
          {scores.length === 0 && (
            <div
              className="glass-card p-4 text-center animate-slide-up"
              style={{ borderColor: 'rgba(46,134,171,0.2)' }}
            >
              <div className="text-2xl mb-2">🎯</div>
              <div className="text-xs font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                No Scores Yet
              </div>
              <div className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
                Phase 2 will add AI scoring against job descriptions
              </div>
              <Link
                href="/jobs"
                className="text-xs no-underline"
                style={{ color: 'var(--accent-light)' }}
              >
                View Jobs →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
