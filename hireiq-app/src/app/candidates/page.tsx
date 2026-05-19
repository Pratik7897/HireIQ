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
  
  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const handleBatchDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedIds.size} candidates?`)) return;
    try {
      const r = await fetch('/api/candidates/batch', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });
      if (r.ok) {
        setSelectedIds(new Set());
        load();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleBatchStatus = async (status: string) => {
    if (!status) return;
    try {
      const r = await fetch('/api/candidates/batch', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds), status }),
      });
      if (r.ok) {
        setSelectedIds(new Set());
        load();
      }
    } catch (e) {
      console.error(e);
    }
  };

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

      {/* Filters & Bulk Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12 }}>
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
        
        {selectedIds.size > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, animation: 'fadeIn 0.2s' }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)', marginRight: 4 }}>
              {selectedIds.size} selected
            </span>
            <Link href={`/compare?ids=${Array.from(selectedIds).join(',')}`} className="btn btn-secondary btn-sm">
              ⚖️ Compare
            </Link>
            <select
              onChange={e => {
                handleBatchStatus(e.target.value);
                e.target.value = '';
              }}
              style={{ width: 140, height: 32, padding: '0 8px', fontSize: 13 }}
              defaultValue=""
            >
              <option value="" disabled>Update status...</option>
              <option value="new">New</option>
              <option value="screening">Screening</option>
              <option value="interview">Interview</option>
              <option value="offer">Offer</option>
              <option value="hired">Hired</option>
              <option value="rejected">Rejected</option>
            </select>
            <button 
              onClick={handleBatchDelete}
              className="btn btn-secondary btn-sm" 
              style={{ color: '#DC2626', borderColor: '#FCA5A5' }}
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 40, paddingLeft: 16 }}>
                <input
                  type="checkbox"
                  checked={selectedIds.size > 0 && selectedIds.size === candidates.length}
                  onChange={(e) => {
                    if (e.target.checked) setSelectedIds(new Set(candidates.map(c => c.id)));
                    else setSelectedIds(new Set());
                  }}
                  style={{ cursor: 'pointer' }}
                />
              </th>
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
                  <td style={{ paddingLeft: 16 }}><div className="skeleton" style={{ width: 14, height: 14, borderRadius: 3 }} /></td>
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
                <td colSpan={7} style={{ padding: 0 }}>
                  <EmptyState
                    title={search || statusFilter ? "No candidates found" : "No Candidates Yet"}
                    description={search || statusFilter ? "No candidates matched your filter or search query. Try adjusting your search." : "Upload resumes in PDF or Word format to automatically extract skills, experience, and contact details."}
                    action={!search && !statusFilter ? <Link href="/upload" className="btn btn-primary btn-sm">Upload first resume</Link> : undefined}
                  />
                </td>
              </tr>
            ) : (
              candidates.map(c => {
                const skills = (c.parsed_json?.skills || []).slice(0, 4);
                const yrs    = c.total_years_experience;
                const isSelected = selectedIds.has(c.id);
                return (
                  <tr key={c.id} style={{ background: isSelected ? '#F9FAFB' : 'transparent' }}>
                    <td style={{ paddingLeft: 16 }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          const newSet = new Set(selectedIds);
                          if (e.target.checked) newSet.add(c.id);
                          else newSet.delete(c.id);
                          setSelectedIds(newSet);
                        }}
                        style={{ cursor: 'pointer' }}
                      />
                    </td>
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
