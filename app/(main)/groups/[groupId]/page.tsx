import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { GroupClient } from '@/components/groups/GroupClient';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

interface Props {
  params: { groupId: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const group = await prisma.group.findUnique({ where: { id: params.groupId }, select: { name: true } });
  return { title: group?.name ?? 'Group' };
}

export default async function GroupPage({ params }: Props) {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const group = await prisma.group.findUnique({
    where: { id: params.groupId },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, username: true, avatarUrl: true, isOnline: true } } },
      },
    },
  });

  if (!group) notFound();

  const membership = group.members.find((m) => m.userId === session.user.id);
  const isMember = !!membership || session.user.role === 'ADMIN';

  if (!isMember) notFound();

  const messages = await prisma.groupMessage.findMany({
    where: { groupId: params.groupId },
    orderBy: { createdAt: 'asc' },
    take: 50,
    include: { author: { select: { id: true, name: true, username: true, avatarUrl: true } } },
  });

  return (
    <GroupClient
      group={group}
      messages={messages.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() }))}
      currentUser={{ id: session.user.id, role: session.user.role as 'MEMBER' | 'ADMIN', memberRole: membership?.role }}
    />
  );
}
