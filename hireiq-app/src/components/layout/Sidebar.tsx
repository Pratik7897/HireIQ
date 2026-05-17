'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

// Minimal inline SVG icons (Tabler-style outline)
const Icons = {
  dashboard: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  ),
  users: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/><path d="M21 21v-2a4 4 0 0 0-3-3.87"/>
    </svg>
  ),
  briefcase: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2"/>
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
      <line x1="12" y1="12" x2="12" y2="12"/><line x1="8" y1="12" x2="16" y2="12"/>
    </svg>
  ),
  upload: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  ),
  chart: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
    </svg>
  ),
  file: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/>
    </svg>
  ),
};

const nav = [
  { href: '/',           label: 'Dashboard',       icon: 'dashboard',  section: 'main' },
  { href: '/candidates', label: 'Candidates',       icon: 'users',      section: 'main' },
  { href: '/jobs',       label: 'Job descriptions', icon: 'briefcase',  section: 'main' },
  { href: '/analytics',  label: 'Analytics',        icon: 'chart',      section: 'main' },
  { href: '/upload',     label: 'Upload resume',    icon: 'upload',     section: 'actions' },
  { href: '/upload-jd',  label: 'Upload JD',        icon: 'file',       section: 'actions' },
];

interface AIStatus { available: boolean; ollama_available?: boolean }

export function Sidebar() {
  const pathname = usePathname();
  const [ai, setAi] = useState<AIStatus | null>(null);

  useEffect(() => {
    fetch('/api/ai-status', { signal: AbortSignal.timeout(4000) })
      .then(r => r.json())
      .then(setAi)
      .catch(() => setAi({ available: false }));
    const t = setInterval(() => {
      fetch('/api/ai-status', { signal: AbortSignal.timeout(4000) })
        .then(r => r.json()).then(setAi).catch(() => setAi({ available: false }));
    }, 30000);
    return () => clearInterval(t);
  }, []);

  const mainItems    = nav.filter(n => n.section === 'main');
  const actionItems  = nav.filter(n => n.section === 'actions');

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div style={{ padding: '16px 14px 12px', borderBottom: '1px solid var(--border)' }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            HireIQ
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
            Hiring platform
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '8px 12px', overflowY: 'auto' }}>
        <span className="nav-section-label" style={{ marginTop: 8 }}>Main</span>
        {mainItems.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-item ${pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href)) ? 'active' : ''}`}
          >
            {Icons[item.icon as keyof typeof Icons]}
            {item.label}
          </Link>
        ))}

        <span className="nav-section-label">Upload</span>
        {actionItems.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-item ${pathname === item.href ? 'active' : ''}`}
          >
            {Icons[item.icon as keyof typeof Icons]}
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Footer status */}
      <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border)' }}>
        {/* AI backend status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <div
            className="status-dot"
            style={{
              background: ai === null ? '#D1D5DB' : ai.available ? '#22c55e' : '#ef4444',
            }}
          />
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {ai === null ? 'Checking AI...' : ai.available ? `AI backend · ${ai.ollama_available ? 'Mistral' : 'spaCy'}` : 'AI offline — run start.sh'}
          </span>
        </div>
        {/* Phase indicator */}
        <div style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.02em' }}>
          Free stack · Phase 2
        </div>
      </div>
    </aside>
  );
}
