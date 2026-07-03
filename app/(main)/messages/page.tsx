import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { MessagesClient } from '@/components/messages/MessagesClient';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Messages' };

export default async function MessagesPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const userId = session.user.id;

  const messages = await prisma.message.findMany({
    where: { OR: [{ senderId: userId }, { receiverId: userId }] },
    orderBy: { createdAt: 'desc' },
    include: {
      sender: { select: { id: true, name: true, username: true, avatarUrl: true, isOnline: true } },
      receiver: { select: { id: true, name: true, username: true, avatarUrl: true, isOnline: true } },
    },
  });

  // De-duplicate conversations
  const seen = new Set<string>();
  const conversations = messages
    .filter((m) => {
      const partnerId = m.senderId === userId ? m.receiverId : m.senderId;
      if (seen.has(partnerId)) return false;
      seen.add(partnerId);
      return true;
    })
    .map((m) => ({
      partner: m.senderId === userId ? m.receiver : m.sender,
      lastMessage: { id: m.id, createdAt: m.createdAt.toISOString(), isMine: m.senderId === userId },
    }));

  return <MessagesClient conversations={conversations} currentUserId={userId} />;
}
