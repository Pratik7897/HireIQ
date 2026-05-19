'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export function KeyboardShortcuts() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle shortcuts modal with '?' when not in an input
      if (e.key === '?' && !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        setOpen(true);
      }
      
      // Close modal on Escape
      if (e.key === 'Escape') {
        setOpen(false);
      }

      // Cmd+K or Ctrl+K for search (simulated here)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        // Prevent default browser search behavior
        e.preventDefault();
        // Here we could trigger the SearchModal if we had access to its state,
        // or just navigate to a search page
      }

      // Quick navigation shortcuts
      if (!['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        if (e.key === 'g') {
          // Wait for next key press for 'go to' sequences
          const handler = (nextE: KeyboardEvent) => {
            if (nextE.key === 'd') router.push('/');
            if (nextE.key === 'c') router.push('/candidates');
            if (nextE.key === 'j') router.push('/jobs');
            if (nextE.key === 'p') router.push('/pipeline');
            if (nextE.key === 'i') router.push('/inbox');
            document.removeEventListener('keydown', handler);
          };
          document.addEventListener('keydown', handler, { once: true });
          
          // Cleanup if no key pressed within 1 second
          setTimeout(() => document.removeEventListener('keydown', handler), 1000);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  if (!open) return null;

  const shortcuts = [
    { key: '?', desc: 'Show this help dialog' },
    { key: 'Cmd + K', desc: 'Global search' },
    { key: 'Esc', desc: 'Close modals/dialogs' },
    { key: 'g then d', desc: 'Go to Dashboard' },
    { key: 'g then c', desc: 'Go to Candidates' },
    { key: 'g then j', desc: 'Go to Jobs' },
    { key: 'g then p', desc: 'Go to Pipeline' },
    { key: 'g then i', desc: 'Go to Inbox' },
  ];

  return (
    <>
      <div
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 999 }}
        onClick={() => setOpen(false)}
      />
      <div
        style={{
          position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: '100%', maxWidth: 400, background: 'white', borderRadius: 12,
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
          zIndex: 1000, overflow: 'hidden'
        }}
      >
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: 16, fontWeight: 600 }}>Keyboard Shortcuts</h3>
          <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>×</button>
        </div>
        
        <div style={{ padding: 20 }}>
          {shortcuts.map((s, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: i === shortcuts.length - 1 ? 0 : 12 }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{s.desc}</span>
              <div style={{ display: 'flex', gap: 4 }}>
                {s.key.split(' ').map((k, j) => (
                  k === 'then' || k === '+' ? (
                    <span key={j} style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>{k}</span>
                  ) : (
                    <kbd key={j} style={{ 
                      background: '#F3F4F6', border: '1px solid #D1D5DB', borderRadius: 4, 
                      padding: '2px 6px', fontSize: 11, fontFamily: 'monospace', color: 'var(--text-primary)',
                      boxShadow: '0 1px 0 rgba(0,0,0,0.05)'
                    }}>
                      {k}
                    </kbd>
                  )
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
