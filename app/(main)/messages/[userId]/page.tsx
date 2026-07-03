import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ChatWindow } from '@/components/messages/ChatWindow';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

interface Props {
  params: { userId: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const user = await prisma.user.findUnique({ where: { id: params.userId }, select: { name: true } });
  return { title: user ? `Chat with ${user.name}` : 'Messages' };
}

export default async function DMPage({ params }: Props) {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const myId = session.user.id;
  const otherId = params.userId;

  const otherUser = await prisma.user.findUnique({
    where: { id: otherId },
    select: { id: true, name: true, username: true, avatarUrl: true, isOnline: true, publicKey: true },
  });

  if (!otherUser) notFound();

  const messages = await prisma.message.findMany({
    where: { OR: [{ senderId: myId, receiverId: otherId }, { senderId: otherId, receiverId: myId }] },
    orderBy: { createdAt: 'asc' },
    take: 50,
    include: { sender: { select: { id: true, name: true, avatarUrl: true } } },
  });

  return (
    <ChatWindow
      otherUser={otherUser}
      initialMessages={messages.map((m) => ({
        id: m.id,
        ciphertext: m.ciphertext,
        nonce: m.nonce,
        senderId: m.senderId,
        createdAt: m.createdAt.toISOString(),
        sender: m.sender,
      }))}
      currentUser={{ id: myId, publicKey: session.user.publicKey }}
    />
  );
}
