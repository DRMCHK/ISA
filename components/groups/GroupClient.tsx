'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Avatar } from '@/components/ui/Avatar';
import { useSocket } from '@/components/providers/SocketProvider';
import { formatRelativeTime } from '@/lib/utils';
import { Send, ArrowLeft, Users, Link as LinkIcon, Copy } from 'lucide-react';
import toast from 'react-hot-toast';

interface GroupMember {
  id: string; role: string;
  user: { id: string; name: string; username: string; avatarUrl: string | null; isOnline: boolean };
}

interface Group {
  id: string; name: string; description: string | null; inviteCode: string;
  members: GroupMember[];
}

interface GroupMsg {
  id: string; content: string; groupId: string; authorId: string; createdAt: string;
  author: { id: string; name: string; username: string; avatarUrl: string | null };
}

interface CurrentUser {
  id: string; role: 'MEMBER' | 'ADMIN'; memberRole?: string;
}

export function GroupClient({
  group, messages: initialMessages, currentUser,
}: {
  group: Group; messages: GroupMsg[]; currentUser: CurrentUser;
}) {
  const { socket } = useSocket();
  const [messages, setMessages] = useState<GroupMsg[]>(initialMessages);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!socket) return;
    socket.emit('join_group', group.id);

    socket.on('group:message', (msg: GroupMsg) => {
      if (msg.groupId !== group.id) return;
      setMessages((prev) => [...prev, msg]);
    });

    return () => { socket.off('group:message'); };
  }, [socket, group.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || sending) return;
    setSending(true);

    const res = await fetch(`/api/groups/${group.id}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: input.trim() }),
    });

    setSending(false);
    if (res.ok) {
      const { message } = (await res.json()) as { message: GroupMsg };
      setMessages((prev) => [...prev, message]);
      socket?.emit('group:message', {
        groupId: group.id, messageId: message.id,
        content: input.trim(), authorName: 'You',
      });
      setInput('');
    } else {
      toast.error('Failed to send');
    }
  }

  function copyInvite() {
    navigator.clipboard.writeText(`${window.location.origin}/groups/join/${group.inviteCode}`);
    toast.success('Invite link copied!');
  }

  return (
    <div className="flex gap-4 h-[calc(100vh-6rem)]">
      {/* Chat */}
      <div className="flex-1 flex flex-col card overflow-hidden">
        <div className="flex items-center gap-3 p-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <Link href="/groups" className="btn-ghost p-1.5"><ArrowLeft size={18} /></Link>
          <div className="w-9 h-9 rounded-xl bg-isa-100 dark:bg-isa-900 flex items-center justify-center text-isa-600 font-bold">
            {group.name[0].toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">{group.name}</p>
            <p className="text-xs text-gray-400">{group.members.length} members</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((m) => {
            const isMine = m.authorId === currentUser.id;
            return (
              <div key={m.id} className={`flex items-end gap-2 animate-fade-in ${isMine ? 'flex-row-reverse' : ''}`}>
                {!isMine && <Avatar name={m.author.name} avatarUrl={m.author.avatarUrl} size="xs" />}
                <div className={`max-w-[75%] ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
                  {!isMine && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-1 mb-0.5">{m.author.name}</span>
                  )}
                  <div className={`px-4 py-2.5 rounded-2xl text-sm ${
                    isMine ? 'bg-isa-600 text-white rounded-br-sm' : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-sm'
                  }`}>
                    {m.content}
                  </div>
                  <span className="text-xs text-gray-400 mt-0.5 px-1">{formatRelativeTime(m.createdAt)}</span>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleSend} className="p-3 border-t border-gray-100 dark:border-gray-800 flex gap-2 shrink-0">
          <input type="text" placeholder="Group message (not encrypted)…" className="input py-2.5 text-sm"
            value={input} onChange={(e) => setInput(e.target.value)} maxLength={2000} />
          <button type="submit" disabled={sending || !input.trim()} className="btn-primary p-2.5">
            {sending ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send size={18} />}
          </button>
        </form>
      </div>

      {/* Members sidebar */}
      <div className="hidden xl:flex flex-col w-60 shrink-0 card p-3 overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Members ({group.members.length})</h3>
        </div>
        <div className="space-y-1">
          {group.members.map((m) => (
            <Link key={m.id} href={`/profile/${m.user.username}`}
              className="flex items-center gap-2 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">
              <Avatar name={m.user.name} avatarUrl={m.user.avatarUrl} size="xs" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">{m.user.name}</p>
                {m.role === 'MODERATOR' && (
                  <span className="text-xs text-isa-600 dark:text-isa-400">Moderator</span>
                )}
              </div>
            </Link>
          ))}
        </div>

        {(currentUser.role === 'ADMIN' || currentUser.memberRole === 'MODERATOR') && (
          <div className="mt-4 border-t border-gray-100 dark:border-gray-800 pt-3">
            <button onClick={copyInvite}
              className="btn-secondary w-full text-xs flex items-center justify-center gap-1.5 py-2">
              <Copy size={13} /> Copy invite link
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
