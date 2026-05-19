import type { Metadata } from 'next';
import './globals.css';
import { ClientLayout } from '@/components/layout/ClientLayout';

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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `
            if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
              document.documentElement.classList.add('dark');
            } else {
              document.documentElement.classList.remove('dark');
            }
          `
        }} />
      </head>
      <body>
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
