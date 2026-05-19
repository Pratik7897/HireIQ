'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { ToastProvider } from '@/components/ui/Toast';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <ToastProvider>
      <a
        href="#main-content"
        style={{
          position: 'absolute', top: -40, left: 0, background: 'var(--accent)', color: 'white',
          padding: '8px 16px', zIndex: 9999, transition: 'top 0.2s'
        }}
        onFocus={(e) => (e.currentTarget.style.top = '0px')}
        onBlur={(e) => (e.currentTarget.style.top = '-40px')}
      >
        Skip to main content
      </a>
      <div className="app-layout">
        <Sidebar mobileOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
        <main id="main-content" className="main-content" tabIndex={-1} style={{ outline: 'none' }}>
          {/* Mobile Header (only visible on small screens) */}
          <div className="mobile-header">
            <button
              className="btn btn-ghost"
              style={{ padding: 8, marginRight: 8 }}
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
            <span style={{ fontWeight: 600, fontSize: 16 }}>HireIQ</span>
          </div>

          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>
      </div>
    </ToastProvider>
  );
}
