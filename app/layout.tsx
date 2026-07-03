import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SessionProvider } from '@/components/providers/SessionProvider';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { ReportModal } from '@/components/ui/ReportModal';
import { Toaster } from 'react-hot-toast';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'ISA Link', template: '%s | ISA Link' },
  description: 'ISA Link — International Student Association. Empowered To Succeed.',
  keywords: ['ISA', 'International Student Association', 'student community', 'social platform'],
  icons: { icon: '/logo.png', apple: '/logo.png' },
  openGraph: {
    siteName: 'ISA Link',
    title: 'ISA Link — Empowered To Succeed',
    description: 'Connect with fellow international students.',
    type: 'website',
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body>
        <ThemeProvider>
          <SessionProvider session={session}>
            {children}
            {session && <ReportModal />}
            <Toaster
              position="bottom-right"
              toastOptions={{
                className: 'dark:bg-gray-800 dark:text-white',
                style: { borderRadius: '12px', fontSize: '14px' },
              }}
            />
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
