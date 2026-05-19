'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Stats {
  totalCandidates: number; totalJobs: number;
  avgMatchScore: number;   totalBiasFlags: number;
}
interface Activity { type: string; at: string; label: string }

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics')
      .then(r => r.json())
      .then(d => { setStats(d.stats); setActivity(d.recentActivity || []); })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page">
      {/* Header */}
      <div className="breadcrumb">HireIQ</div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-desc" style={{ marginBottom: 0 }}>Overview of your hiring pipeline</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link href="/upload" className="btn btn-primary btn-sm">Upload resume</Link>
          <Link href="/upload-jd" className="btn btn-secondary btn-sm">Add job</Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        {[
          { label: 'Total candidates', value: stats?.totalCandidates ?? '—' },
          { label: 'Job descriptions', value: stats?.totalJobs ?? '—' },
          { label: 'Avg match score', value: stats ? `${stats.avgMatchScore}%` : '—' },
          { label: 'Bias flags', value: stats?.totalBiasFlags ?? '—' },
        ].map(s => (
          <div key={s.label} className="card card-pad">
            {loading ? (
              <div className="skeleton" style={{ height: 28, width: 60, marginBottom: 6 }} />
            ) : (
              <div className="stat-value">{s.value}</div>
            )}
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Two column layout */}
      <div className="grid-2">
        {/* Recent activity */}
        <div>
          <div className="section-title">Recent activity</div>
          <div className="card">
            {loading ? (
              <div style={{ padding: 16 }}>
                {[...Array(5)].map((_, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: i < 4 ? '1px solid var(--border)' : 'none' }}>
                    <div className="skeleton" style={{ width: 6, height: 6, borderRadius: '50%' }} />
                    <div className="skeleton" style={{ height: 13, flex: 1 }} />
                  </div>
                ))}
              </div>
            ) : activity.length === 0 ? (
              <div className="empty-state" style={{ padding: '40px 24px' }}>
                <p className="empty-state-desc">No activity yet. Upload a resume to get started.</p>
                <Link href="/upload" className="btn btn-primary btn-sm">Upload resume</Link>
              </div>
            ) : (
              <div>
                {activity.map((ev, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 16px',
                      borderBottom: i < activity.length - 1 ? '1px solid var(--border)' : 'none',
                    }}
                  >
                    <div className="status-dot status-dot-green" style={{ flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{ev.label}</span>
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>
                      {new Date(ev.at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick links */}
        <div>
          <div className="section-title">Quick actions</div>
          <div className="card" style={{ padding: 0 }}>
            {[
              { href: '/upload',     icon: '↑', title: 'Upload resume',    desc: 'Process PDF or DOCX with AI' },
              { href: '/upload-jd',  icon: '＋', title: 'Add job description', desc: 'Parse a JD for scoring' },
              { href: '/pipeline',   icon: '⊞', title: 'Pipeline board',   desc: 'Manage candidate progression' },
              { href: '/analytics',  icon: '◑', title: 'Analytics',        desc: 'Live hiring metrics' },
            ].map((a, i, arr) => (
              <Link
                key={a.href}
                href={a.href}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 16px',
                  borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
                  textDecoration: 'none',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                onMouseLeave={e => (e.currentTarget.style.background = '')}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: 6,
                  background: 'var(--accent-light)', color: 'var(--accent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, flexShrink: 0,
                }}>{a.icon}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{a.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{a.desc}</div>
                </div>
              </Link>
            ))}
          </div>

          {/* Top Candidates Widget */}
          <div className="section-title" style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Top Candidates
            <Link href="/candidates" style={{ fontSize: 12, fontWeight: 500, color: 'var(--accent)', textDecoration: 'none' }}>View all →</Link>
          </div>
          <div className="card">
            {loading ? (
              <div style={{ padding: 16 }}>
                <div className="skeleton" style={{ height: 20, width: '100%', marginBottom: 12 }} />
                <div className="skeleton" style={{ height: 20, width: '100%' }} />
              </div>
            ) : stats?.totalCandidates === 0 ? (
              <div style={{ padding: '24px 16px', textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
                Upload candidates to see top matches
              </div>
            ) : (
              <div>
                {[
                  { name: 'Alice Johnson', role: 'Senior Frontend Engineer', score: 92 },
                  { name: 'Bob Smith', role: 'Product Designer', score: 88 },
                  { name: 'Charlie Davis', role: 'Backend Developer', score: 85 }
                ].map((c, i, arr) => (
                  <div
                    key={c.name}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 16px',
                      borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
                    }}
                  >
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%', background: 'var(--accent-light)',
                      color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 600, flexShrink: 0
                    }}>
                      {c.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.role}</div>
                    </div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: c.score >= 90 ? '#059669' : c.score >= 80 ? '#2563EB' : 'var(--text-primary)' }}>
                      {c.score}%
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
