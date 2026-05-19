'use client';

import { useState } from 'react';
import { useToast } from '@/components/ui/Toast';

interface EmailTemplateModalProps {
  open: boolean;
  onClose: () => void;
  candidateName: string;
  candidateEmail: string;
  defaultType?: 'rejection' | 'interview' | 'offer';
}

export function EmailTemplateModal({ open, onClose, candidateName, candidateEmail, defaultType = 'interview' }: EmailTemplateModalProps) {
  const [type, setType] = useState(defaultType);
  const [loading, setLoading] = useState(false);
  const { success } = useToast();

  if (!open) return null;

  const templates = {
    rejection: {
      subject: `Update on your application to HireIQ`,
      body: `Hi ${candidateName},\n\nThank you for taking the time to apply for the open position at our organization and for speaking with our team.\n\nWhile we were impressed with your background, we have decided to move forward with another candidate who more closely matches our current needs for this particular role.\n\nWe will keep your resume on file and reach out if a better fit opens up in the future.\n\nBest regards,\nThe HireIQ Team`
    },
    interview: {
      subject: `Invitation to Interview - HireIQ`,
      body: `Hi ${candidateName},\n\nWe are excited to invite you to an interview for the position you applied for. We were very impressed by your skills and experience!\n\nPlease let us know your availability over the next week so we can schedule a time to chat.\n\nLooking forward to speaking with you.\n\nBest regards,\nThe HireIQ Team`
    },
    offer: {
      subject: `Job Offer from HireIQ`,
      body: `Hi ${candidateName},\n\nWe are thrilled to formally offer you the position!\n\nWe were incredibly impressed by you throughout the interview process and believe you will be a fantastic addition to our team.\n\nPlease find the attached offer letter outlining the details of your compensation and benefits.\n\nLet us know if you have any questions.\n\nBest regards,\nThe HireIQ Team`
    }
  };

  const currentTemplate = templates[type];

  const handleSend = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      success(`Email sent to ${candidateEmail}`);
      onClose();
    }, 1000);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div className="card card-pad" style={{ width: '100%', maxWidth: 600, animation: 'slideUp 0.2s ease' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>Compose Email</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#9CA3AF' }}>×</button>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          {(['interview', 'offer', 'rejection'] as const).map(t => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`btn btn-sm ${type === t ? 'btn-primary' : 'btn-secondary'}`}
              style={{ textTransform: 'capitalize' }}
            >
              {t} Template
            </button>
          ))}
        </div>

        <div className="form-row">
          <label>To</label>
          <input type="text" value={`${candidateName} <${candidateEmail}>`} readOnly style={{ background: '#F9FAFB' }} />
        </div>
        <div className="form-row">
          <label>Subject</label>
          <input type="text" defaultValue={currentTemplate.subject} />
        </div>
        <div className="form-row">
          <label>Message</label>
          <textarea rows={10} defaultValue={currentTemplate.body} style={{ fontFamily: 'inherit', lineHeight: 1.5 }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
          <button className="btn btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSend} disabled={loading}>
            {loading ? 'Sending...' : 'Send Email'}
          </button>
        </div>
      </div>
    </div>
  );
}
