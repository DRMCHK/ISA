'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';
import { Bell, MessageSquare, Users, LayoutDashboard, LogOut, User, Home } from 'lucide-react';
import { DarkModeToggle } from '@/components/ui/DarkModeToggle';
import { Avatar } from '@/components/ui/Avatar';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/feed', icon: Home, label: 'Feed' },
  { href: '/messages', icon: MessageSquare, label: 'Messages' },
  { href: '/groups', icon: Users, label: 'Groups' },
];

export function Header() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 glass border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
        {/* Logo */}
        <Link href="/feed" className="flex items-center gap-2.5 shrink-0">
          <div className="w-9 h-9 bg-isa-600 rounded-xl flex items-center justify-center overflow-hidden">
            <Image src="/logo.png" alt="ISA Link" width={36} height={36} className="object-contain"
              onError={() => undefined} />
          </div>
          <span className="font-bold text-lg text-gray-900 dark:text-white hidden sm:block">
            ISA <span className="text-isa-600">Link</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1 ml-4">
          {navItems.map(({ href, icon: Icon, label }) => (
            <Link key={href} href={href}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all',
                pathname.startsWith(href)
                  ? 'bg-isa-50 dark:bg-isa-950 text-isa-600 dark:text-isa-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              )}>
              <Icon size={18} />
              <span>{label}</span>
            </Link>
          ))}
          {session?.user?.role === 'ADMIN' && (
            <Link href="/admin"
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all',
                pathname === '/admin'
                  ? 'bg-isa-50 dark:bg-isa-950 text-isa-600 dark:text-isa-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              )}>
              <LayoutDashboard size={18} />
              <span>Admin</span>
            </Link>
          )}
        </nav>

        <div className="flex-1" />

        {/* Right side */}
        <div className="flex items-center gap-2">
          <DarkModeToggle />

          {session && (
            <div className="relative">
              <button onClick={() => setMenuOpen(!menuOpen)} className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all">
                <Avatar name={session.user.name} avatarUrl={session.user.avatarUrl} size="sm" isOnline />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-12 z-50 card shadow-2xl p-2 min-w-52 animate-fade-in">
                  <div className="px-3 py-2 mb-1 border-b border-gray-100 dark:border-gray-800">
                    <p className="font-semibold text-sm text-gray-900 dark:text-white">{session.user.name}</p>
                    <p className="text-xs text-gray-400">@{session.user.username}</p>
                  </div>
                  <Link href={`/profile/${session.user.username}`} onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all">
                    <User size={16} /> My Profile
                  </Link>
                  <button onClick={() => { setMenuOpen(false); signOut({ callbackUrl: '/login' }); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">
                    <LogOut size={16} /> Sign out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
