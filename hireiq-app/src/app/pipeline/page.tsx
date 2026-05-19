'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fmtDate, statusLabel, statusBadgeClass, scoreColor } from '@/lib/utils';
import { Avatar, EmptyState, Spinner } from '@/components/ui/Primitives';

const STATUSES = ['new', 'screening', 'interview', 'offer', 'hired', 'rejected'];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  new:        { label: 'New',        color: '#6B7280', bg: '#F3F4F6' },
  screening:  { label: 'Screening',  color: '#2563EB', bg: '#EFF6FF' },
  interview:  { label: 'Interview',  color: '#B45309', bg: '#FFFBEB' },
  offer:      { label: 'Offer',      color: '#3B6D11', bg: '#EBF2E3' },
  hired:      { label: 'Hired',      color: '#14532D', bg: '#DCFCE7' },
  rejected:   { label: 'Rejected',   color: '#DC2626', bg: '#FEF2F2' },
};

interface Candidate {
  id: string; name: string | null; email: string | null;
  location: string | null; created_at: string; status: string;
  total_years_experience: number | null;
  parsed_json?: { skills?: string[] };
  best_score?: number;
}

interface Job {
  id: string; title: string;
}

export default function PipelinePage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<string>('');
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [draggingOver, setDraggingOver] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/candidates').then(r => r.json()),
      fetch('/api/jobs').then(r => r.json()),
    ]).then(([cData, jData]) => {
      setCandidates(cData.candidates || []);
      setJobs(jData.jobs || []);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (candidateId: string, newStatus: string) => {
    setUpdating(candidateId);
    try {
      await fetch(`/api/candidates/${candidateId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      setCandidates(prev =>
        prev.map(c => c.id === candidateId ? { ...c, status: newStatus } : c)
      );
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setUpdating(null);
    }
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggingId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    if (draggingId && draggingId !== status) {
      const cand = candidates.find(c => c.id === draggingId);
      if (cand && cand.status !== status) {
        updateStatus(draggingId, status);
      }
    }
    setDraggingId(null);
    setDraggingOver(null);
  };

  const grouped = STATUSES.reduce((acc, s) => {
    acc[s] = candidates.filter(c => (c.status || 'new') === s);
    return acc;
  }, {} as Record<string, Candidate[]>);

  // Total pipeline stats
  const total = candidates.length;
  const hired = candidates.filter(c => c.status === 'hired').length;
  const inProgress = candidates.filter(c =>
    ['screening', 'interview', 'offer'].includes(c.status || 'new')
  ).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '24px 32px 16px', borderBottom: '1px solid var(--border)', background: 'var(--bg-page)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <div className="breadcrumb">HireIQ</div>
            <h1 className="page-title" style={{ marginBottom: 0 }}>Pipeline</h1>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <select
              value={selectedJob}
              onChange={e => setSelectedJob(e.target.value)}
              style={{ height: 32, fontSize: 13, padding: '0 8px', width: 200 }}
            >
              <option value="">All jobs</option>
              {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
            </select>
            <Link href="/upload" className="btn btn-primary btn-sm">Upload resume</Link>
          </div>
        </div>

        {/* Mini stats */}
        <div style={{ display: 'flex', gap: 20 }}>
          {[
            { label: 'Total candidates', value: total },
            { label: 'In progress', value: inProgress },
            { label: 'Hired', value: hired },
            { label: 'Conversion', value: total ? `${Math.round((hired / total) * 100)}%` : '0%' },
          ].map(s => (
            <div key={s.label} style={{ display: 'flex', gap: 6, alignItems: 'baseline' }}>
              <span style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>{s.value}</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Kanban board */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
          <Spinner size={24} />
        </div>
      ) : (
        <div
          style={{
            display: 'flex', gap: 0, flex: 1,
            overflowX: 'auto', overflowY: 'hidden',
            padding: '20px 32px',
          }}
        >
          {STATUSES.map(status => {
            const config = STATUS_CONFIG[status];
            const cards = grouped[status] || [];
            const isDragTarget = draggingOver === status;

            return (
              <div
                key={status}
                style={{
                  minWidth: 220, maxWidth: 260, flex: '1 1 220px',
                  display: 'flex', flexDirection: 'column',
                  marginRight: 12,
                }}
                onDragOver={e => { e.preventDefault(); setDraggingOver(status); }}
                onDragLeave={() => setDraggingOver(null)}
                onDrop={e => handleDrop(e, status)}
              >
                {/* Column header */}
                <div
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 12px', marginBottom: 8,
                    background: config.bg, borderRadius: 6,
                    border: `1px solid ${isDragTarget ? config.color : 'transparent'}`,
                    transition: 'border-color 0.15s',
                  }}
                >
                  <span style={{ fontSize: 12, fontWeight: 600, color: config.color, letterSpacing: '0.02em' }}>
                    {config.label.toUpperCase()}
                  </span>
                  <span style={{
                    fontSize: 12, fontWeight: 600, color: config.color,
                    background: 'rgba(0,0,0,0.06)', borderRadius: 10, padding: '0 6px',
                  }}>
                    {cards.length}
                  </span>
                </div>

                {/* Cards */}
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {cards.length === 0 ? (
                    <div
                      style={{
                        border: '1.5px dashed #E5E7EB', borderRadius: 8,
                        height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: isDragTarget ? config.bg : 'transparent',
                        transition: 'background 0.15s',
                      }}
                    >
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Drop here</span>
                    </div>
                  ) : (
                    cards.map(c => (
                      <div
                        key={c.id}
                        draggable
                        onDragStart={e => handleDragStart(e, c.id)}
                        onDragEnd={() => { setDraggingId(null); setDraggingOver(null); }}
                        style={{
                          background: '#FFFFFF', border: '1px solid #E5E7EB',
                          borderRadius: 8, padding: '10px 12px',
                          cursor: 'grab', userSelect: 'none',
                          opacity: draggingId === c.id ? 0.4 : 1,
                          transition: 'opacity 0.15s, box-shadow 0.15s',
                          boxShadow: draggingId === c.id ? 'none' : '0 1px 3px rgba(0,0,0,0.06)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          <Avatar name={c.name} size={24} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {c.name || 'Unknown'}
                            </div>
                          </div>
                          {updating === c.id && <Spinner size={12} />}
                        </div>

                        {c.email && (
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {c.email}
                          </div>
                        )}

                        {c.best_score != null && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                            <div style={{ flex: 1, height: 3, background: '#F3F4F6', borderRadius: 2 }}>
                              <div style={{ width: `${c.best_score}%`, height: '100%', background: scoreColor(c.best_score), borderRadius: 2 }} />
                            </div>
                            <span style={{ fontSize: 11, color: scoreColor(c.best_score), fontWeight: 600 }}>
                              {c.best_score}%
                            </span>
                          </div>
                        )}

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                            {fmtDate(c.created_at)}
                          </span>
                          <Link
                            href={`/candidates/${c.id}`}
                            style={{ fontSize: 11, color: 'var(--accent)', textDecoration: 'none' }}
                            onClick={e => e.stopPropagation()}
                          >
                            View →
                          </Link>
                        </div>

                        {/* Quick status change */}
                        <select
                          value={c.status || 'new'}
                          onChange={e => updateStatus(c.id, e.target.value)}
                          onClick={e => e.stopPropagation()}
                          style={{
                            marginTop: 8, fontSize: 11, height: 24, padding: '0 4px',
                            border: '1px solid var(--border-input)', borderRadius: 4,
                            width: '100%', cursor: 'pointer',
                          }}
                        >
                          {STATUSES.map(s => (
                            <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                          ))}
                        </select>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
