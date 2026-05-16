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
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
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
              { href: '/candidates', icon: '⊞', title: 'View candidates',  desc: 'Browse and search pipeline' },
              { href: '/analytics',  icon: '◑', title: 'Analytics',        desc: 'Live pipeline metrics' },
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

          {/* Pipeline phases */}
          <div className="section-title" style={{ marginTop: 20 }}>Build plan</div>
          <div className="card card-pad">
            {[
              { phase: 'Phase 1', label: 'Foundation & upload',   done: true },
              { phase: 'Phase 2', label: 'AI match scoring',       done: false },
              { phase: 'Phase 3', label: 'Bias analysis',          done: false },
              { phase: 'Phase 4', label: 'Analytics dashboard',    done: false },
              { phase: 'Phase 5', label: 'Auth & access control',  done: false },
            ].map((p, i) => (
              <div
                key={i}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '6px 0',
                  borderBottom: i < 4 ? '1px solid var(--border)' : 'none',
                }}
              >
                <div
                  style={{
                    width: 16, height: 16, borderRadius: 4,
                    background: p.done ? 'var(--accent)' : 'var(--bg-hover)',
                    border: p.done ? 'none' : '1px solid var(--border-input)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}
                >
                  {p.done && <svg width="10" height="10" viewBox="0 0 12 12" fill="white"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>}
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', width: 56, flexShrink: 0 }}>{p.phase}</span>
                <span style={{ fontSize: 13, color: p.done ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{p.label}</span>
                {p.done && <span className="badge badge-green" style={{ marginLeft: 'auto' }}>Done</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
