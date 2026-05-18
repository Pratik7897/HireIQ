import type { Metadata } from 'next';
import './globals.css';
import { Sidebar } from '@/components/layout/Sidebar';
import { ToastProvider } from '@/components/ui/Toast';

export const metadata: Metadata = {
  title: { default: 'HireIQ', template: '%s · HireIQ' },
  description: 'AI-powered resume screening and hiring analytics platform — free local stack',
  keywords: ['hiring', 'recruitment', 'AI', 'resume screening', 'bias detection'],
  authors: [{ name: 'HireIQ' }],
  robots: { index: true, follow: true },
  openGraph: {
    title: 'HireIQ — AI Hiring Platform',
    description: 'AI-powered resume screening with bias detection and smart analytics',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" style={{ colorScheme: 'light', backgroundColor: '#FAFAFA' }}>
      <head>
        <meta name="color-scheme" content="light" />
        <meta name="theme-color" content="#3B6D11" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body style={{ colorScheme: 'light', backgroundColor: '#FAFAFA', color: '#374151' }}>
        <ToastProvider>
          <div className="app-layout">
            <Sidebar />
            <main className="main-content">
              {children}
            </main>
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
