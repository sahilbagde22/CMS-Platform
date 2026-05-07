import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

export const metadata: Metadata = {
  title: {
    default: 'DataHive — Centralized BI Platform',
    template: '%s — DataHive',
  },
  description:
    'Internal BI and chart management platform — upload Excel data, build charts, and get AI-powered insights.',
  keywords: ['dashboard', 'BI', 'charts', 'data', 'excel', 'analytics'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        {children}
        <Toaster
          position="bottom-right"
          theme="dark"
          toastOptions={{
            style: {
              background: '#1e293b',
              border: '1px solid #334155',
              color: '#e2e8f0',
            },
          }}
        />
      </body>
    </html>
  );
}
