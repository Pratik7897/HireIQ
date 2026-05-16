'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';

interface Analytics {
  stats: { totalCandidates: number; totalJobs: number; avgMatchScore: number; totalBiasFlags: number; totalScored: number };
  charts: {
    uploadTrend: { date: string; count: number }[];
    eventBreakdown: { name: string; value: number }[];
    biasDist: { name: string; value: number }[];
    scoreDist: { range: string; count: number }[];
  };
  recentActivity: { type: string; at: string; label: string }[];
}

const GREEN = '#3B6D11';
const COLORS = [GREEN, '#9CA3AF', '#6B7280', '#D1D5DB'];

const fmt = (n: string) => n.replace(/_/g, ' ');

export default function AnalyticsPage() {
  const [data, setData]     = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');

  useEffect(() => {
    fetch('/api/analytics')
      .then(r => { if (!r.ok) throw new Error('Failed'); return r.json(); })
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="page">
      <div className="breadcrumb">HireIQ</div>
      <h1 className="page-title">Analytics</h1>
      <div className="grid-4" style={{ marginBottom: 24 }}>
        {[...Array(4)].map((_, i) => <div key={i} className="card card-pad"><div className="skeleton" style={{ height: 28, width: 60, marginBottom: 8 }} /><div className="skeleton" style={{ height: 12, width: 100 }} /></div>)}
      </div>
      <div className="grid-2">
        {[...Array(2)].map((_, i) => <div key={i} className="card card-pad"><div className="skeleton" style={{ height: 200 }} /></div>)}
      </div>
    </div>
  );

  if (error) return (
    <div className="page">
      <div className="alert alert-error">{error}</div>
    </div>
  );

  const { stats, charts, recentActivity } = data!;
  const hasActivity = recentActivity.length > 0;

  return (
    <div className="page">
      <div className="breadcrumb">HireIQ</div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-desc" style={{ marginBottom: 0 }}>Live data from your Supabase pipeline — synced via Stitch MCP</p>
        </div>
        <span className="badge badge-green">Live</span>
      </div>

      {/* Stats row */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        {[
          { label: 'Total candidates', value: stats.totalCandidates },
          { label: 'Job descriptions', value: stats.totalJobs },
          { label: 'Avg match score',  value: `${stats.avgMatchScore}%` },
          { label: 'Bias flags',       value: stats.totalBiasFlags },
        ].map(s => (
          <div key={s.label} className="card card-pad">
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid-2" style={{ marginBottom: 20 }}>
        {/* Upload trend */}
        <div>
          <div className="section-title">Resumes uploaded (last 14 days)</div>
          <div className="card card-pad">
            {!hasActivity && charts.uploadTrend.every(d => d.count === 0)
              ? <div className="empty-state" style={{ padding: '32px 0' }}><p className="empty-state-desc">Upload resumes to see trends here</p></div>
              : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={charts.uploadTrend} margin={{ left: -20, right: 0, top: 4, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="#F3F4F6" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9CA3AF' }} tickLine={false} axisLine={false} interval={2} />
                    <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ fontSize: 12, border: '1px solid var(--border)', borderRadius: 4, boxShadow: 'none' }} />
                    <Bar dataKey="count" fill={GREEN} radius={[2, 2, 0, 0]} name="Uploaded" />
                  </BarChart>
                </ResponsiveContainer>
              )}
          </div>
        </div>

        {/* Score distribution */}
        <div>
          <div className="section-title">Match score distribution</div>
          <div className="card card-pad">
            {stats.totalScored === 0
              ? <div className="empty-state" style={{ padding: '32px 0' }}><p className="empty-state-desc">Score candidates against a JD in Phase 2</p></div>
              : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={charts.scoreDist} margin={{ left: -20, right: 0, top: 4, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="#F3F4F6" />
                    <XAxis dataKey="range" tick={{ fontSize: 10, fill: '#9CA3AF' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ fontSize: 12, border: '1px solid var(--border)', borderRadius: 4, boxShadow: 'none' }} />
                    <Bar dataKey="count" fill={GREEN} radius={[2, 2, 0, 0]} name="Candidates" />
                  </BarChart>
                </ResponsiveContainer>
              )}
          </div>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid-2" style={{ marginBottom: 20 }}>
        {/* Event breakdown */}
        <div>
          <div className="section-title">Hiring events by type</div>
          <div className="card card-pad">
            {charts.eventBreakdown.length === 0
              ? <div className="empty-state" style={{ padding: '32px 0' }}><p className="empty-state-desc">Events are logged automatically as you use the platform</p></div>
              : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={charts.eventBreakdown} layout="vertical" margin={{ left: 40, right: 0, top: 4, bottom: 0 }}>
                    <XAxis type="number" tick={{ fontSize: 10, fill: '#9CA3AF' }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#9CA3AF' }} tickLine={false} axisLine={false} tickFormatter={fmt} />
                    <Tooltip contentStyle={{ fontSize: 12, border: '1px solid var(--border)', borderRadius: 4, boxShadow: 'none' }} formatter={(v, n) => [v, fmt(String(n))]} />
                    <Bar dataKey="value" fill={GREEN} radius={[0, 2, 2, 0]} name="Events" />
                  </BarChart>
                </ResponsiveContainer>
              )}
          </div>
        </div>

        {/* Bias distribution */}
        <div>
          <div className="section-title">Bias flag severity</div>
          <div className="card card-pad" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {stats.totalBiasFlags === 0
              ? <div className="empty-state" style={{ padding: '32px 0' }}><p className="empty-state-desc">No bias flags detected yet</p></div>
              : (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={charts.biasDist}
                      cx="50%" cy="50%"
                      outerRadius={70} innerRadius={40}
                      dataKey="value" nameKey="name"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {charts.biasDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: 12, border: '1px solid var(--border)', borderRadius: 4, boxShadow: 'none' }} />
                    <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
          </div>
        </div>
      </div>

      {/* Stitch MCP note */}
      <div className="alert alert-info" style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 13 }}>
          <strong>Stitch MCP connected.</strong> Tables <code style={{ fontSize: 11, padding: '1px 4px', background: 'rgba(255,255,255,0.6)', borderRadius: 3 }}>hiring_events</code>, <code style={{ fontSize: 11, padding: '1px 4px', background: 'rgba(255,255,255,0.6)', borderRadius: 3 }}>candidates</code>, <code style={{ fontSize: 11, padding: '1px 4px', background: 'rgba(255,255,255,0.6)', borderRadius: 3 }}>jobs</code>, <code style={{ fontSize: 11, padding: '1px 4px', background: 'rgba(255,255,255,0.6)', borderRadius: 3 }}>candidate_scores</code>, <code style={{ fontSize: 11, padding: '1px 4px', background: 'rgba(255,255,255,0.6)', borderRadius: 3 }}>bias_flags</code> are synced hourly using <code style={{ fontSize: 11 }}>created_at</code> as the incremental replication key.
        </div>
      </div>

      {/* Recent activity */}
      {recentActivity.length > 0 && (
        <div>
          <div className="section-title">Recent hiring events</div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>Event</th><th>Date</th></tr>
              </thead>
              <tbody>
                {recentActivity.slice(0, 10).map((ev, i) => (
                  <tr key={i}>
                    <td><span className="badge badge-gray">{fmt(ev.label)}</span></td>
                    <td style={{ color: 'var(--text-muted)' }}>
                      {new Date(ev.at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
