'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Job } from '@/lib/supabase';

export default function JobsPage() {
  const [jobs, setJobs]     = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/upload-jd')
      .then(r => r.json())
      .then(d => setJobs(d.jobs || []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = jobs.filter(j => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      j.title?.toLowerCase().includes(q) ||
      j.department?.toLowerCase().includes(q) ||
      (j.required_skills || []).some(s => s.toLowerCase().includes(q))
    );
  });

  return (
    <div className="page">
      <div className="breadcrumb">HireIQ</div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 className="page-title">Job descriptions</h1>
          <p className="page-desc" style={{ marginBottom: 0 }}>
            {loading ? 'Loading…' : `${jobs.length} job description${jobs.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Link href="/upload-jd" className="btn btn-primary btn-sm">Add job description</Link>
      </div>

      <div style={{ marginBottom: 16 }}>
        <input type="search" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by title, department, or skill…" style={{ maxWidth: 360 }} />
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Department</th>
              <th>Seniority</th>
              <th>Required skills</th>
              <th>Added</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(4)].map((_, i) => (
                <tr key={i}>
                  {[...Array(6)].map((_, j) => (
                    <td key={j}><div className="skeleton" style={{ height: 14, borderRadius: 3, width: j === 3 ? 200 : 90 }} /></td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className="empty-state">
                    <p className="empty-state-desc">{search ? 'No jobs match your search.' : 'No job descriptions yet.'}</p>
                    {!search && <Link href="/upload-jd" className="btn btn-primary btn-sm">Add first job description</Link>}
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map(job => (
                <tr key={job.id}>
                  <td style={{ fontWeight: 500 }}>{job.title || '—'}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{job.department || '—'}</td>
                  <td>
                    {job.seniority_level
                      ? <span className="badge badge-gray">{job.seniority_level}</span>
                      : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                      {(job.required_skills || []).slice(0, 6).map(s => (
                        <span key={s} className="skill-chip">{s}</span>
                      ))}
                      {(job.required_skills || []).length > 6 && (
                        <span className="skill-chip" style={{ color: 'var(--text-muted)' }}>
                          +{(job.required_skills || []).length - 6}
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>
                    {new Date(job.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td>
                    <Link href={`/candidates?job=${job.id}`} className="btn btn-ghost btn-sm">Score candidates</Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
