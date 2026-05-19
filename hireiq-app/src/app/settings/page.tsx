'use client';

import { useState } from 'react';
import { useToast } from '@/components/ui/Toast';

interface ScoringWeights {
  semanticWeight: number;
  skillWeight: number;
  experienceWeight: number;
}

interface BiasSettings {
  enableAgeDetection: boolean;
  enableGenderDetection: boolean;
  enableDisabilityDetection: boolean;
  enableEducationGatekeeping: boolean;
  enableCultureFitDetection: boolean;
}

export default function SettingsPage() {
  const { success } = useToast();
  const [activeSection, setActiveSection] = useState<string>('scoring');
  const [saving, setSaving] = useState(false);

  const [profile, setProfile] = useState({
    organizationName: 'My Organization',
    recruiterName: '',
    email: '',
    timezone: 'Asia/Kolkata',
  });

  const [scoring, setScoring] = useState<ScoringWeights>({
    semanticWeight: 60,
    skillWeight: 30,
    experienceWeight: 10,
  });

  const [bias, setBias] = useState<BiasSettings>({
    enableAgeDetection: true,
    enableGenderDetection: true,
    enableDisabilityDetection: true,
    enableEducationGatekeeping: true,
    enableCultureFitDetection: true,
  });

  const [retention, setRetention] = useState({
    candidateRetentionDays: 365,
    scoreRetentionDays: 180,
    autoDeleteRejected: false,
  });

  const [notifications, setNotifications] = useState({
    emailOnNewCandidate: true,
    emailOnHighMatch: true,
    emailOnInterviewScheduled: true,
    slackIntegrationEnabled: false,
  });

  const save = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 800)); // Simulate API call
    success('Settings saved successfully');
    setSaving(false);
  };

  const total = scoring.semanticWeight + scoring.skillWeight + scoring.experienceWeight;
  const weightsValid = total === 100;

  const SECTIONS = [
    { id: 'scoring',       label: 'Scoring weights' },
    { id: 'bias',          label: 'Bias detection' },
    { id: 'profile',       label: 'Organization' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'retention',     label: 'Data retention' },
    { id: 'api',           label: 'API & integrations' },
  ];

  return (
    <div className="page">
      <div className="breadcrumb">HireIQ</div>
      <h1 className="page-title">Settings</h1>
      <p className="page-desc">Configure your HireIQ hiring platform</p>

      <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 24, alignItems: 'start' }}>
        {/* Settings nav */}
        <div className="card" style={{ padding: '8px 0' }}>
          {SECTIONS.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '8px 14px', fontSize: 13, border: 'none',
                background: activeSection === s.id ? 'var(--accent-light)' : 'transparent',
                color: activeSection === s.id ? 'var(--accent)' : 'var(--text-secondary)',
                fontWeight: activeSection === s.id ? 500 : 400,
                cursor: 'pointer', fontFamily: 'inherit',
                borderLeft: activeSection === s.id ? '2px solid var(--accent)' : '2px solid transparent',
                transition: 'all 0.1s',
              }}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Settings content */}
        <div className="card card-pad">
          {/* ─── Scoring weights ─── */}
          {activeSection === 'scoring' && (
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Scoring weights</div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
                Configure how match scores are calculated. Weights must sum to 100%.
              </p>

              <div className={`alert ${weightsValid ? 'alert-success' : 'alert-warning'}`} style={{ marginBottom: 20 }}>
                <span>{weightsValid ? '✓' : '⚠'}</span>
                <span>Current total: <strong>{total}%</strong> {weightsValid ? '(valid)' : '— must equal 100%'}</span>
              </div>

              {[
                { key: 'semanticWeight', label: 'Semantic similarity', desc: 'Embedding-based contextual match' },
                { key: 'skillWeight', label: 'Skill overlap', desc: 'Required + preferred skill intersection' },
                { key: 'experienceWeight', label: 'Experience years', desc: 'Years of relevant experience' },
              ].map(({ key, label, desc }) => (
                <div key={key} className="form-row">
                  <label>{label} — {scoring[key as keyof ScoringWeights]}%</label>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>{desc}</p>
                  <input
                    type="range"
                    min={0} max={100}
                    value={scoring[key as keyof ScoringWeights]}
                    onChange={e => setScoring(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                    style={{ width: '100%', height: 6, cursor: 'pointer' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                    <span>0%</span><span>50%</span><span>100%</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ─── Bias detection ─── */}
          {activeSection === 'bias' && (
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Bias detection settings</div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
                Choose which bias categories to detect when analyzing job descriptions and resumes.
              </p>

              {[
                { key: 'enableAgeDetection', label: 'Age bias detection', desc: 'Flags terms like "young", "digital native", "fresh graduate"' },
                { key: 'enableGenderDetection', label: 'Gender bias detection', desc: 'Flags gendered pronouns and non-neutral job titles' },
                { key: 'enableDisabilityDetection', label: 'Disability bias detection', desc: 'Flags terms like "physically fit", "able-bodied"' },
                { key: 'enableEducationGatekeeping', label: 'Education gatekeeping', desc: 'Flags prestige-based educational requirements' },
                { key: 'enableCultureFitDetection', label: 'Culture fit vagueness', desc: 'Flags vague culture-fit and likability criteria' },
              ].map(({ key, label, desc }) => (
                <div
                  key={key}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 12,
                    padding: '12px 0', borderBottom: '1px solid var(--border)',
                  }}
                >
                  <input
                    type="checkbox"
                    id={key}
                    checked={bias[key as keyof BiasSettings]}
                    onChange={e => setBias(prev => ({ ...prev, [key]: e.target.checked }))}
                    style={{ marginTop: 2, cursor: 'pointer', width: 14, height: 14 }}
                  />
                  <div>
                    <label htmlFor={key} style={{ cursor: 'pointer', marginBottom: 2 }}>{label}</label>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ─── Organization ─── */}
          {activeSection === 'profile' && (
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Organization profile</div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
                Basic information about your organization.
              </p>

              <div className="form-grid-2">
                <div className="form-row" style={{ marginBottom: 0 }}>
                  <label>Organization name</label>
                  <input
                    type="text"
                    value={profile.organizationName}
                    onChange={e => setProfile(p => ({ ...p, organizationName: e.target.value }))}
                    placeholder="Acme Corp"
                  />
                </div>
                <div className="form-row" style={{ marginBottom: 0 }}>
                  <label>Primary recruiter</label>
                  <input
                    type="text"
                    value={profile.recruiterName}
                    onChange={e => setProfile(p => ({ ...p, recruiterName: e.target.value }))}
                    placeholder="Jane Smith"
                  />
                </div>
              </div>

              <div className="form-row" style={{ marginTop: 16 }}>
                <label>Contact email</label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
                  placeholder="recruiter@company.com"
                />
              </div>

              <div className="form-row">
                <label>Timezone</label>
                <select value={profile.timezone} onChange={e => setProfile(p => ({ ...p, timezone: e.target.value }))}>
                  <option value="Asia/Kolkata">Asia/Kolkata (IST, +5:30)</option>
                  <option value="America/New_York">America/New_York (EST, -5:00)</option>
                  <option value="America/Los_Angeles">America/Los_Angeles (PST, -8:00)</option>
                  <option value="Europe/London">Europe/London (GMT, +0:00)</option>
                  <option value="Europe/Paris">Europe/Paris (CET, +1:00)</option>
                  <option value="Asia/Singapore">Asia/Singapore (SGT, +8:00)</option>
                </select>
              </div>
            </div>
          )}

          {/* ─── Notifications ─── */}
          {activeSection === 'notifications' && (
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Notification preferences</div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
                Control when and how you receive alerts from HireIQ.
              </p>

              <div className="section-title" style={{ fontSize: 13, marginTop: 16 }}>Email Alerts</div>
              {[
                { key: 'emailOnNewCandidate', label: 'New candidate uploaded', desc: 'Receive an email when a new resume is parsed' },
                { key: 'emailOnHighMatch', label: 'High match score (≥80%)', desc: 'Alert when a candidate scores 80% or higher on a job' },
                { key: 'emailOnInterviewScheduled', label: 'Interview scheduled', desc: 'Notify when an interview is added to the calendar' },
              ].map(({ key, label, desc }) => (
                <div
                  key={key}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 12,
                    padding: '12px 0', borderBottom: '1px solid var(--border)',
                  }}
                >
                  <input
                    type="checkbox"
                    id={key}
                    checked={(notifications as any)[key]}
                    onChange={e => setNotifications(prev => ({ ...prev, [key]: e.target.checked }))}
                    style={{ marginTop: 2, cursor: 'pointer', width: 14, height: 14 }}
                  />
                  <div>
                    <label htmlFor={key} style={{ cursor: 'pointer', marginBottom: 2 }}>{label}</label>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{desc}</p>
                  </div>
                </div>
              ))}

              <div className="section-title" style={{ fontSize: 13, marginTop: 24 }}>Integrations</div>
              <div
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                  padding: '12px 0', borderBottom: '1px solid var(--border)',
                }}
              >
                <input
                  type="checkbox"
                  id="slackIntegrationEnabled"
                  checked={notifications.slackIntegrationEnabled}
                  onChange={e => setNotifications(prev => ({ ...prev, slackIntegrationEnabled: e.target.checked }))}
                  style={{ marginTop: 2, cursor: 'pointer', width: 14, height: 14 }}
                />
                <div>
                  <label htmlFor="slackIntegrationEnabled" style={{ cursor: 'pointer', marginBottom: 2 }}>Enable Slack Notifications</label>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Send pipeline updates directly to a Slack channel</p>
                </div>
              </div>
            </div>
          )}

          {/* ─── Data retention ─── */}
          {activeSection === 'retention' && (
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Data retention</div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
                Configure how long candidate data is retained. Compliant with GDPR and data protection regulations.
              </p>

              <div className="form-row">
                <label>Candidate data retention (days)</label>
                <input
                  type="number"
                  value={retention.candidateRetentionDays}
                  onChange={e => setRetention(p => ({ ...p, candidateRetentionDays: Number(e.target.value) }))}
                  min={30} max={1825}
                />
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                  Candidates uploaded more than {retention.candidateRetentionDays} days ago can be archived.
                </p>
              </div>

              <div className="form-row">
                <label>Score results retention (days)</label>
                <input
                  type="number"
                  value={retention.scoreRetentionDays}
                  onChange={e => setRetention(p => ({ ...p, scoreRetentionDays: Number(e.target.value) }))}
                  min={30} max={730}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 0' }}>
                <input
                  type="checkbox"
                  id="autoDeleteRejected"
                  checked={retention.autoDeleteRejected}
                  onChange={e => setRetention(p => ({ ...p, autoDeleteRejected: e.target.checked }))}
                  style={{ marginTop: 2, cursor: 'pointer' }}
                />
                <div>
                  <label htmlFor="autoDeleteRejected" style={{ cursor: 'pointer' }}>
                    Auto-delete rejected candidates after 90 days
                  </label>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                    Automatically remove rejected candidate data to comply with data minimization principles.
                  </p>
                </div>
              </div>

              <div className="alert alert-warning" style={{ marginTop: 8 }}>
                <span>⚠</span>
                <span>Data deletion is permanent. Always export a backup before enabling auto-delete.</span>
              </div>
            </div>
          )}

          {/* ─── API ─── */}
          {activeSection === 'api' && (
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>API & integrations</div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
                Connection details for external services and the HireIQ API.
              </p>

              {[
                { label: 'AI Backend URL', value: 'http://localhost:8000', masked: false },
                { label: 'Supabase URL', value: process.env.NEXT_PUBLIC_SUPABASE_URL || '(not set)', masked: false },
                { label: 'Supabase Anon Key', value: '••••••••••••••••••••••••••••••••', masked: true },
              ].map(({ label, value, masked }) => (
                <div key={label} className="form-row">
                  <label>{label}</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      value={value}
                      readOnly
                      style={{ paddingRight: 36, fontFamily: masked ? 'monospace' : 'inherit', fontSize: 12 }}
                    />
                    <button
                      onClick={() => navigator.clipboard.writeText(masked ? '' : value)}
                      style={{
                        position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--text-muted)',
                      }}
                      title="Copy"
                    >
                      ⎘
                    </button>
                  </div>
                </div>
              ))}

              <div style={{ marginTop: 8 }} className="alert alert-info">
                <span>ℹ</span>
                <span>Run <code style={{ fontFamily: 'monospace', fontSize: 11 }}>cd python-backend && bash start.sh</code> to start the AI backend.</span>
              </div>
            </div>
          )}

          {/* Save button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
            <button
              className="btn btn-primary"
              onClick={save}
              disabled={saving || (activeSection === 'scoring' && !weightsValid)}
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
