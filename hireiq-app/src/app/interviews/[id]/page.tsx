'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function InterviewDetailPage({ params }: { params: { id: string } }) {
  const [feedback, setFeedback] = useState({ score: 0, notes: '', hire: false });

  return (
    <div className="page" style={{ maxWidth: 900, margin: '0 auto' }}>
      <div className="breadcrumb">
        <Link href="/interviews" style={{ textDecoration: 'none', color: 'inherit' }}>Interviews</Link> / Interview {params.id}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 className="page-title">Candidate Interview</h1>
          <p className="page-desc" style={{ marginBottom: 0 }}>Review interview details and submit feedback</p>
        </div>
        <span className="badge badge-blue">Scheduled</span>
      </div>

      <div className="grid-2">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card card-pad">
            <h2 className="section-title">Interview Details</h2>
            <div style={{ fontSize: 13, lineHeight: 1.6 }}>
              <p><strong>Candidate:</strong> Alice Johnson</p>
              <p><strong>Role:</strong> Senior Frontend Engineer</p>
              <p><strong>Time:</strong> Today, 2:00 PM (60 min)</p>
              <p><strong>Interviewer:</strong> Sarah Team</p>
              <p><strong>Meeting Link:</strong> <a href="#" style={{ color: 'var(--accent)' }}>https://meet.google.com/abc-xyz</a></p>
            </div>
          </div>

          <div className="card card-pad">
            <h2 className="section-title">Suggested Questions</h2>
            <ul style={{ paddingLeft: 16, fontSize: 13, lineHeight: 1.6, color: 'var(--text-secondary)' }}>
              <li style={{ marginBottom: 8 }}>Can you explain a complex React state management issue you resolved?</li>
              <li style={{ marginBottom: 8 }}>How do you approach performance optimization in a large Single Page Application?</li>
              <li style={{ marginBottom: 8 }}>Describe your experience with CSS variables and theme toggles.</li>
              <li>What is your strategy for writing unit tests for frontend components?</li>
            </ul>
          </div>
        </div>

        <div className="card card-pad">
          <h2 className="section-title">Interview Feedback</h2>
          <div className="form-row">
            <label>Score (1-10)</label>
            <input 
              type="number" 
              min="1" max="10" 
              value={feedback.score || ''} 
              onChange={e => setFeedback({ ...feedback, score: Number(e.target.value) })}
            />
          </div>
          
          <div className="form-row">
            <label>Detailed Notes</label>
            <textarea 
              rows={6} 
              value={feedback.notes} 
              onChange={e => setFeedback({ ...feedback, notes: e.target.value })}
              placeholder="Candidate's strengths, weaknesses, and general impressions..."
            />
          </div>
          
          <div className="form-row">
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 400 }}>
              <input 
                type="checkbox" 
                checked={feedback.hire} 
                onChange={e => setFeedback({ ...feedback, hire: e.target.checked })}
              />
              Recommend to hire
            </label>
          </div>

          <button className="btn btn-primary" style={{ width: '100%' }}>Submit Feedback</button>
        </div>
      </div>
    </div>
  );
}
