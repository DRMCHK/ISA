'use client';

import Link from 'next/link';
import { Avatar } from '@/components/ui/Avatar';
import { useSocket } from '@/components/providers/SocketProvider';
import { formatRelativeTime } from '@/lib/utils';
import { MessageSquare, Inbox } from 'lucide-react';

interface Conversation {
  partner: { id: string; name: string; username: string; avatarUrl: string | null; isOnline: boolean };
  lastMessage: { id: string; createdAt: string; isMine: boolean };
}

export function MessagesClient({
  conversations,
  currentUserId,
}: {
  conversations: Conversation[];
  currentUserId: string;
}) {
  const { onlineFriends } = useSocket();

  return (
    <div className="max-w-xl mx-auto animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
        <MessageSquare className="text-isa-600" size={24} />
        Direct Messages
      </h1>

      {conversations.length === 0 ? (
        <div className="card p-12 text-center">
          <Inbox className="mx-auto text-gray-300 dark:text-gray-600 mb-3" size={48} />
          <p className="font-semibold text-gray-600 dark:text-gray-400">No messages yet</p>
          <p className="text-sm text-gray-400 mt-1">Find a friend and start a conversation.</p>
        </div>
      ) : (
        <div className="card divide-y divide-gray-100 dark:divide-gray-800">
          {conversations.map(({ partner, lastMessage }) => {
            const isOnline = onlineFriends.has(partner.id) || partner.isOnline;
            return (
              <Link key={partner.id} href={`/messages/${partner.id}`}
                className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all">
                <Avatar name={partner.name} avatarUrl={partner.avatarUrl} size="md" isOnline={isOnline} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white">{partner.name}</p>
                  <p className="text-sm text-gray-400 truncate">
                    {lastMessage.isMine ? 'You: ' : ''}🔒 Encrypted message
                  </p>
                </div>
                <span className="text-xs text-gray-400 shrink-0">
                  {formatRelativeTime(lastMessage.createdAt)}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
