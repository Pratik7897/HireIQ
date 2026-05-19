'use client';

import { useEffect, useState } from 'react';
import { Spinner, EmptyState } from '@/components/ui/Primitives';

interface AnalyticsData {
  totalCandidates: number;
  totalJobs: number;
  shortlistedCount: number;
  hiredCount: number;
  biasFlagsCount: number;
  pipelineStats: { status: string; count: number }[];
  recentActivity: { date: string; count: number }[];
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, this would fetch from an /api/analytics endpoint
    // For now, we simulate the data load to match the UI flow
    setTimeout(() => {
      setData({
        totalCandidates: 142,
        totalJobs: 12,
        shortlistedCount: 45,
        hiredCount: 8,
        biasFlagsCount: 14,
        pipelineStats: [
          { status: 'new', count: 42 },
          { status: 'screening', count: 35 },
          { status: 'interview', count: 28 },
          { status: 'offer', count: 12 },
          { status: 'hired', count: 8 },
          { status: 'rejected', count: 17 },
        ],
        recentActivity: [
          { date: 'Mon', count: 12 },
          { date: 'Tue', count: 19 },
          { date: 'Wed', count: 15 },
          { date: 'Thu', count: 22 },
          { date: 'Fri', count: 8 },
          { date: 'Sat', count: 2 },
          { date: 'Sun', count: 0 },
        ]
      });
      setLoading(false);
    }, 600);
  }, []);

  if (loading) {
    return (
      <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <Spinner size={32} />
      </div>
    );
  }

  if (!data) {
    return <div className="page"><EmptyState title="No data" description="Analytics could not be loaded." icon="📊" /></div>;
  }

  const conversionRate = data.totalCandidates ? Math.round((data.hiredCount / data.totalCandidates) * 100) : 0;
  const shortlistRate = data.totalCandidates ? Math.round((data.shortlistedCount / data.totalCandidates) * 100) : 0;

  return (
    <div className="page">
      <div className="breadcrumb">HireIQ</div>
      <h1 className="page-title">Analytics & Reporting</h1>
      <p className="page-desc">Overview of your hiring pipeline and AI screening metrics.</p>

      {/* Top level metrics */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        {[
          { label: 'Total Candidates', value: data.totalCandidates },
          { label: 'Open Roles', value: data.totalJobs },
          { label: 'Conversion Rate', value: `${conversionRate}%` },
          { label: 'Bias Flags Detected', value: data.biasFlagsCount, color: '#DC2626' },
        ].map(s => (
          <div key={s.label} className="card card-pad">
            <div className="stat-value" style={{ color: s.color || 'var(--text-primary)' }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ gap: 24, alignItems: 'start' }}>
        {/* Pipeline breakdown */}
        <div className="card card-pad">
          <div className="section-title">Pipeline Breakdown</div>
          <div style={{ marginTop: 16 }}>
            {data.pipelineStats.map((stat, i) => {
              const pct = Math.round((stat.count / data.totalCandidates) * 100);
              return (
                <div key={stat.status} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                    <span style={{ textTransform: 'capitalize', fontWeight: 500 }}>{stat.status}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{stat.count} ({pct}%)</span>
                  </div>
                  <div style={{ width: '100%', height: 8, background: '#F3F4F6', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{
                      width: `${pct}%`, height: '100%', borderRadius: 4,
                      background: stat.status === 'hired' ? '#3B6D11' : stat.status === 'rejected' ? '#DC2626' : 'var(--accent)'
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI Efficiency */}
        <div className="card card-pad">
          <div className="section-title">AI Screening Efficiency</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
            <div style={{ padding: '16px', background: '#F9FAFB', borderRadius: 8, border: '1px solid #E5E7EB' }}>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>Shortlist Rate</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontSize: 24, fontWeight: 600 }}>{shortlistRate}%</span>
                <span style={{ fontSize: 12, color: '#3B6D11' }}>Avg match score {'>'} 70%</span>
              </div>
            </div>

            <div style={{ padding: '16px', background: '#F9FAFB', borderRadius: 8, border: '1px solid #E5E7EB' }}>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>Time Saved (Estimated)</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontSize: 24, fontWeight: 600 }}>~{Math.round(data.totalCandidates * 5 / 60)} hrs</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>based on 5 mins per manual review</span>
              </div>
            </div>
            
            <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
              Export Full Report (CSV)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
