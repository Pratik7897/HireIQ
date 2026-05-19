'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { fmtDate, statusBadgeClass, statusLabel } from '@/lib/utils';
import { Avatar, Spinner, EmptyState } from '@/components/ui/Primitives';

interface Candidate {
  id: string; name: string | null; email: string | null;
  location: string | null; created_at: string; status: string;
  total_years_experience: number | null;
  parsed_json?: { skills?: string[] };
}

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 20;

  const load = useCallback(async () => {
    setLoading(true);
    const offset = (page - 1) * limit;
    try {
      const qs = new URLSearchParams({ limit: String(limit), offset: String(offset) });
      if (search) qs.append('search', search);
      if (statusFilter) qs.append('status', statusFilter);

      const r = await fetch(`/api/candidates?${qs.toString()}`);
      const d = await r.json();
      setCandidates(d.candidates || []);
      setTotal(d.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    const t = setTimeout(() => { load(); }, 300);
    return () => clearTimeout(t);
  }, [load]);

  const totalPages = Math.ceil(total / limit) || 1;

  const exportCSV = () => {
    window.open(`/api/export?type=candidates${statusFilter ? `&status=${statusFilter}` : ''}`, '_blank');
  };

  return (
    <div className="page">
      <div className="breadcrumb">HireIQ</div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 className="page-title">Candidates</h1>
          <p className="page-desc" style={{ marginBottom: 0 }}>
            {loading ? 'Loading…' : `${total} candidate${total !== 1 ? 's' : ''} in the pipeline`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={exportCSV}>
            ↓ Export CSV
          </button>
          <Link href="/upload" className="btn btn-primary btn-sm">Upload resume</Link>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <input
          type="search"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by name, email, or skill…"
          style={{ width: '100%', maxWidth: 360 }}
        />
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          style={{ width: 160 }}
        >
          <option value="">All statuses</option>
          <option value="new">New</option>
          <option value="screening">Screening</option>
          <option value="interview">Interview</option>
          <option value="offer">Offer</option>
          <option value="hired">Hired</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Table */}
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Candidate</th>
              <th>Skills</th>
              <th style={{ width: 80 }}>Exp</th>
              <th style={{ width: 110 }}>Status</th>
              <th style={{ width: 120 }}>Uploaded</th>
              <th style={{ width: 80 }}></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(6)].map((_, i) => (
                <tr key={i}>
                  <td>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <div className="skeleton" style={{ width: 32, height: 32, borderRadius: '50%' }} />
                      <div>
                        <div className="skeleton" style={{ height: 12, width: 100, marginBottom: 4 }} />
                        <div className="skeleton" style={{ height: 10, width: 140 }} />
                      </div>
                    </div>
                  </td>
                  <td><div className="skeleton" style={{ height: 14, borderRadius: 3, width: 160 }} /></td>
                  <td><div className="skeleton" style={{ height: 14, borderRadius: 3, width: 40 }} /></td>
                  <td><div className="skeleton" style={{ height: 20, borderRadius: 10, width: 70 }} /></td>
                  <td><div className="skeleton" style={{ height: 14, borderRadius: 3, width: 80 }} /></td>
                  <td><div className="skeleton" style={{ height: 24, borderRadius: 4, width: 50 }} /></td>
                </tr>
              ))
            ) : candidates.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className="empty-state">
                    <p className="empty-state-desc">{search || statusFilter ? 'No candidates match your filters.' : 'No candidates yet. Upload a resume to get started.'}</p>
                    {!search && !statusFilter && <Link href="/upload" className="btn btn-primary btn-sm">Upload resume</Link>}
                  </div>
                </td>
              </tr>
            ) : (
              candidates.map(c => {
                const skills = (c.parsed_json?.skills || []).slice(0, 4);
                const yrs    = c.total_years_experience;
                return (
                  <tr key={c.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Avatar name={c.name} size={32} />
                        <div>
                          <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{c.name || 'Unknown'}</div>
                          {c.email && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.email}</div>}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                        {skills.map(s => <span key={s} className="skill-chip">{s}</span>)}
                        {(c.parsed_json?.skills || []).length > 4 && (
                          <span className="skill-chip" style={{ background: '#F3F4F6', color: 'var(--text-muted)' }}>
                            +{(c.parsed_json?.skills || []).length - 4}
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{yrs != null ? `${yrs}y` : '—'}</td>
                    <td>
                      <span className={`badge ${statusBadgeClass(c.status)}`}>{statusLabel(c.status)}</span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                      {fmtDate(c.created_at)}
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

      {/* Pagination */}
      {!loading && total > limit && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} candidates
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              className="btn btn-secondary btn-sm"
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
            >
              Prev
            </button>
            <div style={{ display: 'flex', alignItems: 'center', padding: '0 8px', fontSize: 13 }}>
              Page {page} of {totalPages}
            </div>
            <button
              className="btn btn-secondary btn-sm"
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
