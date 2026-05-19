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
  pipeline: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="4" rx="1"/><rect x="2" y="10" width="14" height="4" rx="1"/>
      <rect x="2" y="17" width="9" height="4" rx="1"/>
    </svg>
  ),
  settings: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  interviews: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  inbox: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
    </svg>
  ),
};

const nav = [
  { href: '/',           label: 'Dashboard',        icon: 'dashboard',  section: 'main' },
  { href: '/inbox',      label: 'Inbox',            icon: 'inbox',      section: 'main' },
  { href: '/candidates', label: 'Candidates',       icon: 'users',      section: 'main' },
  { href: '/pipeline',   label: 'Pipeline',         icon: 'pipeline',   section: 'main' },
  { href: '/jobs',       label: 'Job descriptions', icon: 'briefcase',  section: 'main' },
  { href: '/analytics',  label: 'Analytics',        icon: 'chart',      section: 'main' },
  { href: '/interviews', label: 'Interviews',       icon: 'interviews', section: 'main' },
  { href: '/upload',     label: 'Upload resume',    icon: 'upload',     section: 'actions' },
  { href: '/upload-jd',  label: 'Upload JD',        icon: 'file',       section: 'actions' },
  { href: '/settings',   label: 'Settings',         icon: 'settings',   section: 'settings' },
];

import { SearchModal } from '@/components/ui/SearchModal';

interface AIStatus { available: boolean; ollama_available?: boolean }
interface SidebarProps { mobileOpen?: boolean; onClose?: () => void }

export const Sidebar = React.memo(function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [ai, setAi] = useState<AIStatus | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  // Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(s => !s);
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  const mainItems     = nav.filter(n => n.section === 'main');
  const actionItems   = nav.filter(n => n.section === 'actions');
  const settingsItems = nav.filter(n => n.section === 'settings');

  return (
    <>
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
      {mobileOpen && (
        <div
          onClick={onClose}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 90 }}
        />
      )}
      <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
      {/* Logo */}
      <div style={{ padding: '16px 14px 12px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 16, background: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 500 }}>
            HR
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Sarah Team</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Free Plan</div>
          </div>
        </div>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-primary)', letterSpacing: '-0.01em', marginTop: 12 }}>
            HireIQ
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
            Hiring platform
          </div>
        </Link>
      </div>

      {/* Search button */}
      <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)' }}>
        <button
          onClick={() => setSearchOpen(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, width: '100%',
            padding: '6px 10px', border: '1px solid var(--border-input)', borderRadius: 6,
            background: '#F9FAFB', cursor: 'pointer', fontSize: 12, color: 'var(--text-muted)',
            fontFamily: 'inherit', transition: 'border-color 0.1s, background 0.1s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = '#FFFFFF'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-input)'; e.currentTarget.style.background = '#F9FAFB'; }}
          aria-label="Search (Cmd+K)"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <span style={{ flex: 1, textAlign: 'left' }}>Search…</span>
          <kbd style={{ fontSize: 10, background: 'var(--bg-hover)', border: '1px solid var(--border)', borderRadius: 3, padding: '0 4px', fontFamily: 'monospace' }}>
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '8px 12px', overflowY: 'auto' }}>
        <span className="nav-section-label" style={{ marginTop: 8 }}>Main</span>
        {mainItems.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-item ${pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href)) ? 'active' : ''}`}
            style={{ position: 'relative' }}
          >
            {Icons[item.icon as keyof typeof Icons]}
            {item.label}
            {item.href === '/inbox' && (
              <span style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                background: 'var(--accent)', color: 'white', fontSize: 10, fontWeight: 600,
                padding: '2px 6px', borderRadius: 10, lineHeight: 1
              }}>
                1
              </span>
            )}
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

        <span className="nav-section-label">Account</span>
        {settingsItems.map(item => (
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
      <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
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
            HireIQ · v4.0
          </div>
        </div>
        <button
          onClick={() => {
            if (document.documentElement.classList.contains('dark')) {
              document.documentElement.classList.remove('dark');
              localStorage.theme = 'light';
            } else {
              document.documentElement.classList.add('dark');
              localStorage.theme = 'dark';
            }
          }}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-muted)', display: 'flex', padding: 4
          }}
          aria-label="Toggle dark mode"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
          </svg>
        </button>
      </div>
    </aside>
    </>
  );
}
