'use client';

import { useState } from 'react';
import { EmptyState } from '@/components/ui/Primitives';

interface Message {
  id: string;
  sender: string;
  subject: string;
  preview: string;
  date: string;
  read: boolean;
}

const mockMessages: Message[] = [
  { id: '1', sender: 'System', subject: 'New candidate match > 85%', preview: 'Alice Johnson scored 92% for Senior Frontend Engineer.', date: '10:42 AM', read: false },
  { id: '2', sender: 'System', subject: 'Interview scheduled', preview: 'Bob Smith confirmed interview for tomorrow at 2 PM.', date: 'Yesterday', read: true },
  { id: '3', sender: 'Team', subject: 'Feedback on Charlie', preview: 'Charlie was great, let us move to the offer stage.', date: 'Mon', read: true },
];

export default function InboxPage() {
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = messages.find(m => m.id === selectedId);

  const markRead = (id: string) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, read: true } : m));
    setSelectedId(id);
  };

  return (
    <div className="page" style={{ height: '100vh', display: 'flex', flexDirection: 'column', padding: 0 }}>
      <div style={{ padding: '24px 32px 16px' }}>
        <div className="breadcrumb">HireIQ</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <h1 className="page-title">Inbox</h1>
            <p className="page-desc" style={{ marginBottom: 0 }}>Notifications and messages</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, borderTop: '1px solid var(--border)', overflow: 'hidden' }}>
        {/* Sidebar */}
        <div style={{ width: 320, borderRight: '1px solid var(--border)', overflowY: 'auto', background: '#FAFAFA' }}>
          {messages.map(m => (
            <div
              key={m.id}
              onClick={() => markRead(m.id)}
              style={{
                padding: '16px', borderBottom: '1px solid var(--border)', cursor: 'pointer',
                background: selectedId === m.id ? '#F3F4F6' : m.read ? 'transparent' : 'white',
                borderLeft: `3px solid ${!m.read ? 'var(--accent)' : 'transparent'}`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: m.read ? 500 : 600 }}>{m.sender}</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{m.date}</span>
              </div>
              <div style={{ fontSize: 13, fontWeight: m.read ? 400 : 500, color: 'var(--text-primary)', marginBottom: 4 }}>
                {m.subject}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {m.preview}
              </div>
            </div>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', background: 'white' }}>
          {selected ? (
            <div style={{ padding: '32px' }}>
              <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>{selected.subject}</h2>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-secondary)' }}>
                  <span>From: <strong>{selected.sender}</strong></span>
                  <span>{selected.date}</span>
                </div>
              </div>
              <div style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.6 }}>
                <p>{selected.preview}</p>
                <p style={{ marginTop: 16 }}>This is a generated system message to keep you informed of activity within your workspace.</p>
              </div>
            </div>
          ) : (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <EmptyState icon="📬" description="Select a message to read" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
