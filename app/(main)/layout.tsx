import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { SocketProvider } from '@/components/providers/SocketProvider';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  return (
    <SocketProvider userId={session?.user?.id ?? ''}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Header />
        <div className="max-w-7xl mx-auto px-4 pt-6 pb-12 flex gap-6">
          {/* Sidebar */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-20">
              <Sidebar />
            </div>
          </aside>
          {/* Main content */}
          <main className="flex-1 min-w-0">
            {children}
          </main>
        </div>
      </div>
    </SocketProvider>
  );
}
