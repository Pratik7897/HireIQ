import type { Metadata } from 'next';
import './globals.css';
import { Sidebar } from '@/components/layout/Sidebar';

export const metadata: Metadata = {
  title: { default: 'HireIQ', template: '%s · HireIQ' },
  description: 'AI-powered resume screening and hiring analytics platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" style={{ colorScheme: 'light', backgroundColor: '#FAFAFA' }}>
      <head>
        <meta name="color-scheme" content="light" />
      </head>
      <body style={{ colorScheme: 'light', backgroundColor: '#FAFAFA', color: '#374151' }}>
        <div className="app-layout">
          <Sidebar />
          <main className="main-content">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
