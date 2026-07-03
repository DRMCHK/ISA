'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Avatar } from '@/components/ui/Avatar';
import { MessageBubble } from '@/components/messages/MessageBubble';
import { useSocket } from '@/components/providers/SocketProvider';
import { encryptMessage, decryptMessage, type EncryptedMessage } from '@/lib/encryption';
import { Send, ArrowLeft, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

interface RawMessage {
  id: string; ciphertext: string; nonce: string; senderId: string; createdAt: string;
  sender: { id: string; name: string; avatarUrl: string | null };
}

interface DecryptedMessage {
  id: string; text: string; senderId: string; createdAt: string;
  sender: { id: string; name: string; avatarUrl: string | null };
}

interface OtherUser {
  id: string; name: string; username: string; avatarUrl: string | null;
  isOnline: boolean; publicKey: string;
}

interface CurrentUser {
  id: string; publicKey: string;
}

export function ChatWindow({
  otherUser,
  initialMessages,
  currentUser,
}: {
  otherUser: OtherUser;
  initialMessages: RawMessage[];
  currentUser: CurrentUser;
}) {
  const { socket, onlineFriends } = useSocket();
  const [messages, setMessages] = useState<DecryptedMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getPrivateKey = () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('isa_privateKey');
  };

  const decryptAll = useCallback(
    (raw: RawMessage[]): DecryptedMessage[] => {
      const privKey = getPrivateKey();
      return raw.map((m) => {
        if (!privKey) return { ...m, text: '[No private key found]' };
        const senderPubKey = m.senderId === currentUser.id ? otherUser.publicKey : otherUser.publicKey;
        const decrypted = decryptMessage({ ciphertext: m.ciphertext, nonce: m.nonce }, senderPubKey, privKey);
        return { ...m, text: decrypted ?? '[Decryption failed]' };
      });
    },
    [currentUser.id, otherUser.publicKey]
  );

  useEffect(() => {
    setMessages(decryptAll(initialMessages));
  }, [initialMessages, decryptAll]);

  useEffect(() => {
    if (!socket) return;

    socket.on('dm:receive', (data: { senderId: string; ciphertext: string; nonce: string; messageId: string; createdAt: string }) => {
      if (data.senderId !== otherUser.id) return;
      const privKey = getPrivateKey();
      const text = privKey
        ? (decryptMessage({ ciphertext: data.ciphertext, nonce: data.nonce }, otherUser.publicKey, privKey) ?? '[Decryption failed]')
        : '[No private key]';

      setMessages((prev) => [...prev, {
        id: data.messageId, text, senderId: data.senderId, createdAt: data.createdAt,
        sender: { id: otherUser.id, name: otherUser.name, avatarUrl: otherUser.avatarUrl },
      }]);
    });

    socket.on('dm:typing', ({ senderId }: { senderId: string }) => {
      if (senderId !== otherUser.id) return;
      setIsTyping(true);
      if (typingTimer.current) clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => setIsTyping(false), 3000);
    });

    return () => {
      socket.off('dm:receive');
      socket.off('dm:typing');
    };
  }, [socket, otherUser]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || sending) return;

    const privKey = getPrivateKey();
    if (!privKey) {
      toast.error('Private key not found. Please re-register or restore your key.');
      return;
    }

    const encrypted = encryptMessage(input.trim(), otherUser.publicKey, privKey);
    setSending(true);

    const res = await fetch(`/api/messages/${otherUser.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(encrypted),
    });

    setSending(false);

    if (res.ok) {
      const { message } = (await res.json()) as { message: { id: string; createdAt: string } };
      setMessages((prev) => [...prev, {
        id: message.id, text: input.trim(), senderId: currentUser.id, createdAt: message.createdAt,
        sender: { id: currentUser.id, name: 'You', avatarUrl: null },
      }]);
      socket?.emit('dm:send', { receiverId: otherUser.id, ...encrypted, messageId: message.id });
      setInput('');
    } else {
      toast.error('Failed to send message');
    }
  }

  function handleType(val: string) {
    setInput(val);
    socket?.emit('dm:typing', { receiverId: otherUser.id });
  }

  const partnerOnline = onlineFriends.has(otherUser.id) || otherUser.isOnline;

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] max-h-[800px] card overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
        <Link href="/messages" className="btn-ghost p-2 mr-1"><ArrowLeft size={18} /></Link>
        <Avatar name={otherUser.name} avatarUrl={otherUser.avatarUrl} size="sm" isOnline={partnerOnline} />
        <div className="flex-1">
          <p className="font-semibold text-gray-900 dark:text-white">{otherUser.name}</p>
          <p className="text-xs text-gray-400">{partnerOnline ? 'Online' : `@${otherUser.username}`}</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1 rounded-full">
          <Lock size={11} /> E2E Encrypted
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} isMine={m.senderId === currentUser.id} />
        ))}
        {isTyping && (
          <div className="flex items-center gap-2 text-xs text-gray-400 animate-fade-in">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            {otherUser.name} is typing…
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-3 border-t border-gray-100 dark:border-gray-800 flex gap-2 shrink-0">
        <input
          type="text"
          placeholder="Send an encrypted message…"
          className="input py-2.5 text-sm"
          value={input}
          onChange={(e) => handleType(e.target.value)}
          maxLength={2000}
        />
        <button type="submit" disabled={sending || !input.trim()} className="btn-primary p-2.5">
          {sending ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send size={18} />}
        </button>
      </form>
    </div>
  );
}
