'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function UploadJDPage() {
  const [text, setText]   = useState('');
  const [title, setTitle] = useState('');
  const [dept, setDept]   = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [result, setResult] = useState<any>(null);
  const [errMsg, setErrMsg] = useState('');

  const submit = async () => {
    if (!text.trim()) return;
    setStatus('loading'); setErrMsg('');
    try {
      const res = await fetch('/api/upload-jd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, title, department: dept }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setResult(data.job);
      setStatus('done');
    } catch (err: any) {
      setErrMsg(err.message);
      setStatus('error');
    }
  };

  if (status === 'done' && result) {
    return (
      <div className="page" style={{ maxWidth: 680 }}>
        <div className="breadcrumb">HireIQ / Upload JD</div>
        <h1 className="page-title">Job description saved</h1>
        <p className="page-desc">AI extracted skills and metadata from the job description.</p>

        <div className="card card-pad" style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 }}>Title</div>
            <div style={{ fontWeight: 500 }}>{result.title || '—'}</div>
          </div>
          {result.seniority_level && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 }}>Seniority</div>
              <span className="badge badge-blue">{result.seniority_level}</span>
            </div>
          )}
          {(result.required_skills || []).length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Required skills</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {result.required_skills.map((s: string) => <span key={s} className="skill-chip">{s}</span>)}
              </div>
            </div>
          )}
          {(result.preferred_skills || []).length > 0 && (
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Preferred skills</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {result.preferred_skills.map((s: string) => <span key={s} className="skill-chip">{s}</span>)}
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <Link href="/jobs" className="btn btn-primary btn-sm">View all jobs</Link>
          <button className="btn btn-secondary btn-sm" onClick={() => { setText(''); setTitle(''); setDept(''); setStatus('idle'); setResult(null); }}>
            Add another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page" style={{ maxWidth: 680 }}>
      <div className="breadcrumb">HireIQ / Upload JD</div>
      <h1 className="page-title">Add job description</h1>
      <p className="page-desc">Paste a job description. AI will extract required skills, seniority, and metadata for candidate scoring.</p>

      <div className="card card-pad">
        <div className="form-grid-2">
          <div className="form-row" style={{ marginBottom: 0 }}>
            <label>Job title (optional)</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Senior Backend Engineer" />
          </div>
          <div className="form-row" style={{ marginBottom: 0 }}>
            <label>Department (optional)</label>
            <input type="text" value={dept} onChange={e => setDept(e.target.value)} placeholder="e.g. Engineering" />
          </div>
        </div>

        <div className="form-row" style={{ marginBottom: 0, marginTop: 16 }}>
          <label>Job description *</label>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Paste the full job description here…"
            style={{ minHeight: 240 }}
          />
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{text.length} characters</div>
        </div>

        {status === 'error' && (
          <div className="alert alert-error" style={{ marginTop: 16 }}>
            {errMsg}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
          <button
            className="btn btn-primary"
            onClick={submit}
            disabled={!text.trim() || status === 'loading'}
          >
            {status === 'loading' ? 'Processing…' : 'Save job description'}
          </button>
          <Link href="/jobs" className="btn btn-secondary">Cancel</Link>
        </div>
      </div>
    </div>
  );
}
