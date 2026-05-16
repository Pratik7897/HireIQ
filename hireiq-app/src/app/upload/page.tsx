'use client';

import { useEffect, useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Link from 'next/link';

interface UploadState {
  status: 'idle' | 'uploading' | 'done' | 'error';
  message?: string;
  candidateId?: string;
  candidateName?: string;
}

export default function UploadResumePage() {
  const [uploads, setUploads] = useState<UploadState[]>([]);
  const [files, setFiles] = useState<File[]>([]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'application/pdf': ['.pdf'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] },
    maxSize: 5 * 1024 * 1024,
    onDrop: accepted => setFiles(prev => [...prev, ...accepted]),
    onDropRejected: rejected => {
      rejected.forEach(f => {
        const err = f.errors[0]?.message || 'Invalid file';
        alert(`${f.file.name}: ${err}`);
      });
    },
  });

  const removeFile = (idx: number) => setFiles(f => f.filter((_, i) => i !== idx));

  const uploadAll = async () => {
    if (!files.length) return;
    const newUploads: UploadState[] = files.map(() => ({ status: 'uploading' }));
    setUploads(newUploads);

    await Promise.all(
      files.map(async (file, i) => {
        const form = new FormData();
        form.append('file', file);
        try {
          const res = await fetch('/api/upload-resume', { method: 'POST', body: form });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Upload failed');
          setUploads(u => u.map((s, j) => j === i
            ? { status: 'done', candidateId: data.candidate?.id, candidateName: data.candidate?.name || file.name }
            : s));
        } catch (err: any) {
          setUploads(u => u.map((s, j) => j === i ? { status: 'error', message: err.message } : s));
        }
      })
    );
    setFiles([]);
  };

  const allDone   = uploads.length > 0 && uploads.every(u => u.status === 'done' || u.status === 'error');
  const anyUploading = uploads.some(u => u.status === 'uploading');

  return (
    <div className="page" style={{ maxWidth: 680 }}>
      <div className="breadcrumb">HireIQ / Upload</div>
      <h1 className="page-title">Upload resumes</h1>
      <p className="page-desc">Upload PDF or DOCX files. AI extracts name, skills, experience, and saves to the candidate pipeline.</p>

      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={`dropzone${isDragActive ? ' active' : ''}`}
        style={{ marginBottom: 16 }}
      >
        <input {...getInputProps()} />
        <div style={{ marginBottom: 8 }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 8px', display: 'block' }}>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>
          {isDragActive ? 'Drop files here' : 'Drag and drop resumes, or click to browse'}
        </p>
        <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>PDF or DOCX · max 5 MB per file</p>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          {files.map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderBottom: i < files.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
              </svg>
              <span style={{ flex: 1, fontSize: 13, color: 'var(--text-primary)' }}>{f.name}</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', marginRight: 8 }}>{(f.size / 1024).toFixed(0)} KB</span>
              <button onClick={() => removeFile(i)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0, fontSize: 16, lineHeight: 1 }}>×</button>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      {files.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          <button className="btn btn-primary" onClick={uploadAll} disabled={anyUploading}>
            {anyUploading ? 'Processing…' : `Process ${files.length} file${files.length > 1 ? 's' : ''}`}
          </button>
          <button className="btn btn-secondary" onClick={() => setFiles([])} disabled={anyUploading}>
            Clear
          </button>
        </div>
      )}

      {/* Results */}
      {uploads.length > 0 && (
        <div>
          <div className="section-title">Results</div>
          <div className="card">
            {uploads.map((u, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderBottom: i < uploads.length - 1 ? '1px solid var(--border)' : 'none' }}>
                {u.status === 'uploading' && <div className="status-dot status-dot-yellow" />}
                {u.status === 'done'      && <div className="status-dot status-dot-green" />}
                {u.status === 'error'     && <div className="status-dot status-dot-red" />}
                <span style={{ flex: 1, fontSize: 13, color: 'var(--text-primary)' }}>
                  {u.status === 'uploading' ? 'Processing…'
                    : u.status === 'done' ? `${u.candidateName || 'Candidate'} added`
                    : u.message || 'Upload failed'}
                </span>
                {u.status === 'done' && u.candidateId && (
                  <Link href={`/candidates/${u.candidateId}`} className="btn btn-ghost btn-sm">View →</Link>
                )}
              </div>
            ))}
          </div>
          {allDone && (
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <Link href="/candidates" className="btn btn-primary btn-sm">View all candidates</Link>
              <button className="btn btn-secondary btn-sm" onClick={() => { setUploads([]); }}>Upload more</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
