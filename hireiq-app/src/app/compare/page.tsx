'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Avatar, EmptyState, SkillChips, ScoreBar } from '@/components/ui/Primitives';

export default function ComparePage() {
  const [query, setQuery] = useState('');

  // Mock selected candidates for comparison
  const candidates = [
    {
      id: '1', name: 'Alice Johnson', email: 'alice@example.com', exp: 6,
      skills: ['React', 'TypeScript', 'Node.js', 'Next.js', 'GraphQL'],
      score: 92, status: 'interview',
    },
    {
      id: '2', name: 'Bob Smith', email: 'bob.smith@example.com', exp: 4,
      skills: ['React', 'JavaScript', 'CSS', 'HTML'],
      score: 75, status: 'screening',
    },
    {
      id: '3', name: 'Charlie Davis', email: 'cdavis@example.com', exp: 8,
      skills: ['TypeScript', 'Node.js', 'AWS', 'Docker', 'React'],
      score: 88, status: 'offer',
    }
  ];

  return (
    <div className="page" style={{ height: '100vh', display: 'flex', flexDirection: 'column', padding: 0 }}>
      <div style={{ padding: '24px 32px 16px', borderBottom: '1px solid var(--border)' }}>
        <div className="breadcrumb">HireIQ</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <h1 className="page-title">Compare Candidates</h1>
            <p className="page-desc" style={{ marginBottom: 0 }}>Side-by-side comparison of shortlisted applicants</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                alert('Compare link copied to clipboard!');
              }}
            >
              🔗 Share shortlist
            </button>
            <Link href="/candidates" className="btn btn-secondary btn-sm">
              Add candidate
            </Link>
            <button className="btn btn-primary btn-sm">
              Export comparison
            </button>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowX: 'auto', overflowY: 'auto', padding: 32 }}>
        {candidates.length < 2 ? (
          <EmptyState icon="⚖️" title="Select candidates" description="Select at least two candidates to compare their skills and experience." />
        ) : (
          <div style={{ display: 'flex', gap: 24, minWidth: 'min-content' }}>
            {/* Legend column */}
            <div style={{ width: 180, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 24, paddingTop: 140 }}>
              <div style={{ height: 40, fontWeight: 500, display: 'flex', alignItems: 'center' }}>Match Score</div>
              <div style={{ height: 40, fontWeight: 500, display: 'flex', alignItems: 'center' }}>Experience</div>
              <div style={{ height: 40, fontWeight: 500, display: 'flex', alignItems: 'center' }}>Status</div>
              <div style={{ fontWeight: 500 }}>Top Skills</div>
            </div>

            {/* Candidate columns */}
            {candidates.map(c => (
              <div key={c.id} style={{ width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div className="card card-pad" style={{ height: 120, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative' }}>
                  <button onClick={() => {/* remove */}} aria-label={`Remove ${c.name} from comparison`} style={{ position: 'absolute', top: 8, right: 8, background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>×</button>
                  <Avatar name={c.name} size={48} />
                  <div style={{ fontWeight: 600, marginTop: 8 }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{c.email}</div>
                </div>

                <div style={{ height: 40, display: 'flex', alignItems: 'center', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ fontWeight: 600, fontSize: 16 }}>{c.score}%</div>
                  <ScoreBar score={c.score} height={4} />
                </div>

                <div style={{ height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {c.exp} years
                </div>

                <div style={{ height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className={`badge ${c.status === 'offer' ? 'badge-green' : c.status === 'interview' ? 'badge-yellow' : 'badge-blue'}`}>
                    {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                  </span>
                </div>

                <div className="card card-pad" style={{ flex: 1 }}>
                  <SkillChips skills={c.skills} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
