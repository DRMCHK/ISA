'use client';

import Image from 'next/image';
import { getInitials } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface AvatarProps {
  name: string;
  avatarUrl?: string | null;
  isOnline?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizes = {
  xs: { container: 'w-7 h-7', text: 'text-xs', badge: 'w-2 h-2 border' },
  sm: { container: 'w-9 h-9', text: 'text-sm', badge: 'w-2.5 h-2.5 border' },
  md: { container: 'w-11 h-11', text: 'text-sm', badge: 'w-3 h-3 border-2' },
  lg: { container: 'w-16 h-16', text: 'text-xl', badge: 'w-4 h-4 border-2' },
  xl: { container: 'w-24 h-24', text: 'text-3xl', badge: 'w-5 h-5 border-2' },
};

export function Avatar({ name, avatarUrl, isOnline, size = 'md', className }: AvatarProps) {
  const s = sizes[size];

  return (
    <div className={cn('relative inline-flex shrink-0', className)}>
      {avatarUrl ? (
        <Image
          src={avatarUrl}
          alt={name}
          width={96}
          height={96}
          className={cn(s.container, 'rounded-full object-cover')}
        />
      ) : (
        <div
          className={cn(
            s.container,
            'rounded-full bg-gradient-to-br from-isa-500 to-isa-700 flex items-center justify-center text-white font-semibold select-none'
          )}
        >
          <span className={s.text}>{getInitials(name)}</span>
        </div>
      )}

      {isOnline !== undefined && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full bg-emerald-500 border-white dark:border-gray-900',
            s.badge,
            !isOnline && 'bg-gray-400'
          )}
          title={isOnline ? 'Online' : 'Offline'}
        />
      )}
    </div>
  );
}
