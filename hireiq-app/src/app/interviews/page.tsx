'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fmtDate, fmtRelative } from '@/lib/utils';
import { Avatar, EmptyState, Spinner } from '@/components/ui/Primitives';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';

interface Interview {
  id: string;
  candidate_name: string;
  candidate_id: string;
  job_title: string;
  job_id: string;
  scheduled_at: string;
  duration_minutes: number;
  type: 'phone' | 'video' | 'onsite' | 'technical';
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  notes: string | null;
  feedback_score: number | null;
  interviewer: string | null;
  meeting_link: string | null;
}

const TYPE_LABELS: Record<string, string> = {
  phone:     '📞 Phone screen',
  video:     '📹 Video call',
  onsite:    '🏢 Onsite',
  technical: '💻 Technical',
};

const STATUS_COLORS: Record<string, string> = {
  scheduled:  'badge-blue',
  completed:  'badge-green',
  cancelled:  'badge-red',
  no_show:    'badge-yellow',
};

export default function InterviewsPage() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'schedule'>('list');
  const [showSchedule, setShowSchedule] = useState(false);
  const { success } = useToast();

  // Mock data since we don't have a DB table yet
  useEffect(() => {
    setTimeout(() => {
      setInterviews([]);
      setLoading(false);
    }, 400);
  }, []);

  const upcoming = interviews.filter(i =>
    i.status === 'scheduled' && new Date(i.scheduled_at) >= new Date()
  );
  const past = interviews.filter(i =>
    i.status !== 'scheduled' || new Date(i.scheduled_at) < new Date()
  );

  return (
    <div className="page">
      <div className="breadcrumb">HireIQ</div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 className="page-title">Interviews</h1>
          <p className="page-desc" style={{ marginBottom: 0 }}>
            {loading ? 'Loading…' : `${interviews.length} interview${interviews.length !== 1 ? 's' : ''} total`}
          </p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowSchedule(true)}>
          + Schedule interview
        </button>
      </div>

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        {[
          { label: 'Scheduled', value: interviews.filter(i => i.status === 'scheduled').length },
          { label: 'Completed', value: interviews.filter(i => i.status === 'completed').length },
          { label: 'Cancelled', value: interviews.filter(i => i.status === 'cancelled').length },
          { label: 'This week', value: interviews.filter(i => {
            const now = new Date();
            const d = new Date(i.scheduled_at);
            const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
            return d >= startOfWeek;
          }).length },
        ].map(s => (
          <div key={s.label} className="card card-pad">
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab-item ${view === 'list' ? 'active' : ''}`} onClick={() => setView('list')}>
          List view
        </button>
        <button className={`tab-item ${view === 'schedule' ? 'active' : ''}`} onClick={() => setView('schedule')}>
          Calendar
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
          <Spinner size={24} />
        </div>
      ) : interviews.length === 0 ? (
        <div className="card">
          <EmptyState
            icon="📅"
            title="No interviews scheduled"
            description="Schedule your first interview to track candidate progress."
            action={
              <button className="btn btn-primary btn-sm" onClick={() => setShowSchedule(true)}>
                Schedule interview
              </button>
            }
          />
        </div>
      ) : view === 'list' ? (
        <div>
          {upcoming.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div className="section-title">Upcoming</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {upcoming.map(iv => (
                  <InterviewCard key={iv.id} interview={iv} />
                ))}
              </div>
            </div>
          )}
          {past.length > 0 && (
            <div>
              <div className="section-title">Past</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {past.map(iv => (
                  <InterviewCard key={iv.id} interview={iv} />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <WeekCalendar interviews={interviews} />
      )}

      {/* Schedule modal */}
      <Modal
        open={showSchedule}
        onClose={() => setShowSchedule(false)}
        title="Schedule interview"
        width={520}
      >
        <ScheduleForm
          onSave={(data) => {
            console.log('Schedule interview:', data);
            success('Interview scheduled successfully');
            setShowSchedule(false);
          }}
          onCancel={() => setShowSchedule(false)}
        />
      </Modal>
    </div>
  );
}

function InterviewCard({ interview }: { interview: Interview }) {
  const isPast = new Date(interview.scheduled_at) < new Date();
  return (
    <div className="card card-pad" style={{ opacity: interview.status === 'cancelled' ? 0.6 : 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Avatar name={interview.candidate_name} size={36} />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            <span style={{ fontSize: 13, fontWeight: 500 }}>{interview.candidate_name}</span>
            <span className={`badge ${STATUS_COLORS[interview.status]}`}>{interview.status}</span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            {interview.job_title} · {TYPE_LABELS[interview.type]}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 500 }}>
            {new Date(interview.scheduled_at).toLocaleDateString('en-US', {
              weekday: 'short', month: 'short', day: 'numeric',
            })}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {new Date(interview.scheduled_at).toLocaleTimeString('en-US', {
              hour: '2-digit', minute: '2-digit',
            })} · {interview.duration_minutes}min
          </div>
        </div>
      </div>
      {interview.notes && (
        <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-secondary)', padding: '6px 10px', background: '#F9FAFB', borderRadius: 4 }}>
          {interview.notes}
        </div>
      )}
    </div>
  );
}

function WeekCalendar({ interviews }: { interviews: Interview[] }) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());

  return (
    <div className="card card-pad">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
        {days.map((day, i) => {
          const date = new Date(startOfWeek);
          date.setDate(startOfWeek.getDate() + i);
          const dayInterviews = interviews.filter(iv => {
            const d = new Date(iv.scheduled_at);
            return d.toDateString() === date.toDateString();
          });
          const isToday = date.toDateString() === new Date().toDateString();

          return (
            <div key={day} style={{ minHeight: 100 }}>
              <div style={{
                fontSize: 11, fontWeight: 500, textAlign: 'center', marginBottom: 6,
                color: isToday ? 'var(--accent)' : 'var(--text-muted)',
              }}>
                {day}
                <div style={{
                  fontSize: 14, fontWeight: isToday ? 600 : 400,
                  color: isToday ? 'var(--accent)' : 'var(--text-primary)',
                }}>
                  {date.getDate()}
                </div>
              </div>
              {dayInterviews.map(iv => (
                <div key={iv.id} style={{
                  background: 'var(--accent-light)', color: 'var(--accent)',
                  borderRadius: 4, padding: '3px 6px', fontSize: 11, marginBottom: 3,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {iv.candidate_name}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ScheduleForm({ onSave, onCancel }: { onSave: (data: any) => void; onCancel: () => void }) {
  const [form, setForm] = useState({
    candidateName: '',
    jobTitle: '',
    date: '',
    time: '',
    duration: 60,
    type: 'video',
    interviewer: '',
    meetingLink: '',
    notes: '',
  });

  const set = (k: string, v: string | number) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div>
      <div className="form-grid-2">
        <div className="form-row" style={{ marginBottom: 0 }}>
          <label>Candidate name</label>
          <input type="text" value={form.candidateName} onChange={e => set('candidateName', e.target.value)} placeholder="Jane Doe" />
        </div>
        <div className="form-row" style={{ marginBottom: 0 }}>
          <label>Job title</label>
          <input type="text" value={form.jobTitle} onChange={e => set('jobTitle', e.target.value)} placeholder="Software Engineer" />
        </div>
      </div>

      <div className="form-grid-2" style={{ marginTop: 12 }}>
        <div className="form-row" style={{ marginBottom: 0 }}>
          <label>Date</label>
          <input type="date" value={form.date} onChange={e => set('date', e.target.value)} />
        </div>
        <div className="form-row" style={{ marginBottom: 0 }}>
          <label>Time</label>
          <input type="time" value={form.time} onChange={e => set('time', e.target.value)} />
        </div>
      </div>

      <div className="form-grid-2" style={{ marginTop: 12 }}>
        <div className="form-row" style={{ marginBottom: 0 }}>
          <label>Duration (minutes)</label>
          <select value={form.duration} onChange={e => set('duration', Number(e.target.value))}>
            {[30, 45, 60, 90, 120].map(d => <option key={d} value={d}>{d} min</option>)}
          </select>
        </div>
        <div className="form-row" style={{ marginBottom: 0 }}>
          <label>Interview type</label>
          <select value={form.type} onChange={e => set('type', e.target.value)}>
            <option value="phone">Phone screen</option>
            <option value="video">Video call</option>
            <option value="onsite">Onsite</option>
            <option value="technical">Technical</option>
          </select>
        </div>
      </div>

      <div className="form-row" style={{ marginTop: 12 }}>
        <label>Interviewer</label>
        <input type="text" value={form.interviewer} onChange={e => set('interviewer', e.target.value)} placeholder="John Smith" />
      </div>

      <div className="form-row">
        <label>Meeting link</label>
        <input type="url" value={form.meetingLink} onChange={e => set('meetingLink', e.target.value)} placeholder="https://meet.google.com/..." />
      </div>

      <div className="form-row">
        <label>Notes</label>
        <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} placeholder="Any prep notes or focus areas…" />
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
        <button className="btn btn-secondary btn-sm" onClick={onCancel}>Cancel</button>
        <button className="btn btn-primary btn-sm" onClick={() => onSave(form)}>Schedule</button>
      </div>
    </div>
  );
}
