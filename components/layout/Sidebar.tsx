'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Avatar } from '@/components/ui/Avatar';
import { useSocket } from '@/components/providers/SocketProvider';
import { formatRelativeTime, cn } from '@/lib/utils';
import { Home, MessageSquare, Users, UserPlus, Loader2 } from 'lucide-react';

interface Friend {
  id: string; name: string; username: string; avatarUrl: string | null;
  isOnline: boolean; lastSeen: string;
}

interface Group {
  id: string; name: string; avatarUrl: string | null; role: string;
}

export function Sidebar() {
  const { data: session } = useSession();
  const { onlineFriends } = useSocket();
  const pathname = usePathname();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/friends').then((r) => r.json()),
      fetch('/api/groups').then((r) => r.json()),
    ])
      .then(([fd, gd]: [{ friends: Friend[] }, { groups: Group[] }]) => {
        setFriends(fd.friends ?? []);
        setGroups(gd.groups ?? []);
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  const navItems = [
    { href: '/feed', icon: Home, label: 'Feed' },
    { href: '/messages', icon: MessageSquare, label: 'Messages' },
    { href: '/groups', icon: Users, label: 'Groups' },
  ];

  return (
    <div className="space-y-4">
      {/* Navigation */}
      <nav className="card p-2 space-y-0.5">
        {navItems.map(({ href, icon: Icon, label }) => (
          <Link key={href} href={href}
            className={cn('sidebar-link', pathname.startsWith(href) && 'active')}>
            <Icon size={18} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>

      {/* Friends */}
      <div className="card p-3">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Friends</h3>
          {friends.length > 0 && (
            <span className="text-xs text-emerald-500 font-medium">{onlineFriends.size} online</span>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-3">
            <Loader2 size={18} className="animate-spin text-gray-400" />
          </div>
        ) : friends.length === 0 ? (
          <div className="text-center py-3">
            <UserPlus size={24} className="mx-auto text-gray-300 dark:text-gray-600 mb-1.5" />
            <p className="text-xs text-gray-400 dark:text-gray-500">Find friends to connect</p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {friends.slice(0, 8).map((friend) => {
              const isOnline = onlineFriends.has(friend.id);
              return (
                <Link key={friend.id} href={`/profile/${friend.username}`}
                  className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all group">
                  <Avatar name={friend.name} avatarUrl={friend.avatarUrl} size="xs" isOnline={isOnline} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">{friend.name}</p>
                    <p className="text-xs text-gray-400 truncate">
                      {isOnline ? 'Online' : `${formatRelativeTime(friend.lastSeen)}`}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Groups */}
      {groups.length > 0 && (
        <div className="card p-3">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Groups</h3>
          <div className="space-y-0.5">
            {groups.slice(0, 5).map((group) => (
              <Link key={group.id} href={`/groups/${group.id}`}
                className={cn('sidebar-link', pathname === `/groups/${group.id}` && 'active')}>
                <div className="w-7 h-7 rounded-lg bg-isa-100 dark:bg-isa-900 flex items-center justify-center text-isa-600 dark:text-isa-400 font-bold text-xs shrink-0">
                  {group.name[0].toUpperCase()}
                </div>
                <span className="text-xs truncate">{group.name}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ISA branding */}
      <div className="text-center">
        <p className="text-xs text-gray-400 dark:text-gray-600">ISA Link &bull; Empowered To Succeed</p>
      </div>
    </div>
  );
}
