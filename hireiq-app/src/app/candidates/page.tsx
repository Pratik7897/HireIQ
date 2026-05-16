'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Candidate {
  id: string; name: string | null; email: string | null;
  location: string | null; created_at: string;
  parsed_json?: { skills?: string[]; total_years_experience?: number };
}

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/candidates')
      .then(r => r.json())
      .then(d => setCandidates(d.candidates || []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = candidates.filter(c => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      c.name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.location?.toLowerCase().includes(q) ||
      (c.parsed_json?.skills || []).some(s => s.toLowerCase().includes(q))
    );
  });

  return (
    <div className="page">
      <div className="breadcrumb">HireIQ</div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 className="page-title">Candidates</h1>
          <p className="page-desc" style={{ marginBottom: 0 }}>
            {loading ? 'Loading…' : `${candidates.length} candidate${candidates.length !== 1 ? 's' : ''} in the pipeline`}
          </p>
        </div>
        <Link href="/upload" className="btn btn-primary btn-sm">Upload resume</Link>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 16 }}>
        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, email, or skill…"
          style={{ maxWidth: 360 }}
        />
      </div>

      {/* Table */}
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Skills</th>
              <th>Exp</th>
              <th>Uploaded</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}>
                  {[...Array(6)].map((_, j) => (
                    <td key={j}><div className="skeleton" style={{ height: 14, borderRadius: 3, width: j === 2 ? 160 : j === 5 ? 50 : 100 }} /></td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className="empty-state">
                    <p className="empty-state-desc">{search ? 'No candidates match your search.' : 'No candidates yet. Upload a resume to get started.'}</p>
                    {!search && <Link href="/upload" className="btn btn-primary btn-sm">Upload resume</Link>}
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map(c => {
                const skills = (c.parsed_json?.skills || []).slice(0, 5);
                const yrs    = c.parsed_json?.total_years_experience;
                return (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 500 }}>{c.name || <span style={{ color: 'var(--text-muted)' }}>Unknown</span>}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{c.email || '—'}</td>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                        {skills.map(s => <span key={s} className="skill-chip">{s}</span>)}
                        {(c.parsed_json?.skills || []).length > 5 && (
                          <span className="skill-chip" style={{ color: 'var(--text-muted)' }}>+{(c.parsed_json?.skills || []).length - 5}</span>
                        )}
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{yrs != null ? `${yrs}y` : '—'}</td>
                    <td style={{ color: 'var(--text-muted)' }}>
                      {new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td>
                      <Link href={`/candidates/${c.id}`} className="btn btn-ghost btn-sm">View</Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
