import './globals.css';
import { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/next';

export const metadata: Metadata = {
  title: 'Track AI | The Automated Job Tracker SaaS',
  description: 'Automatically scan your Gmail inbox, parse job application emails using AI, and organize your job search in a beautiful Kanban dashboard. Save time and get hired faster.',
  keywords: ['job tracker', 'job application tracker', 'career dashboard', 'gmail sync job tracker', 'AI job board'],
  authors: [{ name: 'Track AI Team' }],
  openGraph: {
    title: 'Track AI - Automated Job Tracker SaaS',
    description: 'Track job applications automatically with Gmail sync and AI parsing.',
    type: 'website',
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body>
        <div className="ambient-glow-1"></div>
        <div className="ambient-glow-2"></div>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
