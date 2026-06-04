import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/components/theme-provider';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

export const metadata: Metadata = {
  title: {
    default: 'PulseHQ — Operations Intelligence Platform',
    template: '%s — PulseHQ',
  },
  description:
    'Operations intelligence platform — upload Excel data, track workforce metrics, and get AI-powered insights for your services business.',
  keywords: ['dashboard', 'operations', 'workforce', 'metrics', 'excel', 'analytics', 'BI'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
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
        </ThemeProvider>
      </body>
    </html>
  );
}
