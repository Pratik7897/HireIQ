'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Job {
  id: string; title: string; department: string | null; seniority_level: string | null;
  required_skills: string[]; preferred_skills: string[]; summary: string | null; created_at: string;
}

export default function JobsPage() {
  const [jobs, setJobs]       = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');

  useEffect(() => {
    fetch('/api/jobs')
      .then(r => r.json())
      .then(d => setJobs(d.jobs || []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = jobs.filter(j => {
    const q = search.toLowerCase();
    return !q || j.title?.toLowerCase().includes(q) ||
      j.department?.toLowerCase().includes(q) ||
      (j.required_skills || []).some(s => s.toLowerCase().includes(q));
  });

  return (
    <div className="page">
      <div className="breadcrumb">HireIQ</div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 className="page-title">Job descriptions</h1>
          <p className="page-desc" style={{ marginBottom: 0 }}>
            {loading ? 'Loading…' : `${jobs.length} job${jobs.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Link href="/upload-jd" className="btn btn-primary btn-sm">Add job description</Link>
      </div>

      <div style={{ marginBottom: 16 }}>
        <input type="search" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by title, department, or skill…" style={{ maxWidth: 360 }} />
      </div>

      {/* Job cards */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card card-pad">
              <div className="skeleton" style={{ height: 16, width: 200, marginBottom: 8 }} />
              <div className="skeleton" style={{ height: 12, width: 300 }} />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <p className="empty-state-desc">{search ? 'No jobs match your search.' : 'No job descriptions yet.'}</p>
            {!search && <Link href="/upload-jd" className="btn btn-primary btn-sm">Add first job description</Link>}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(job => (
            <div key={job.id} className="card card-pad" style={{ cursor: 'default' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontWeight: 500, fontSize: 14, color: '#374151' }}>{job.title || 'Untitled'}</span>
                    {job.seniority_level && (
                      <span className="badge badge-gray">{job.seniority_level}</span>
                    )}
                    {job.department && (
                      <span style={{ fontSize: 12, color: '#9CA3AF' }}>· {job.department}</span>
                    )}
                  </div>
                  {job.summary && (
                    <p style={{ fontSize: 12, color: '#6B7280', marginBottom: 8, lineHeight: 1.5 }}>
                      {job.summary.slice(0, 160)}{job.summary.length > 160 ? '…' : ''}
                    </p>
                  )}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                    {(job.required_skills || []).slice(0, 8).map(s => (
                      <span key={s} className="skill-chip">{s}</span>
                    ))}
                    {(job.required_skills || []).length > 8 && (
                      <span className="skill-chip" style={{ color: '#9CA3AF' }}>+{(job.required_skills || []).length - 8}</span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
                  <Link href={`/jobs/${job.id}`} className="btn btn-primary btn-sm">
                    View &amp; score →
                  </Link>
                  <span style={{ fontSize: 11, color: '#9CA3AF' }}>
                    {new Date(job.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
