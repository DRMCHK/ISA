import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ProfileClient } from '@/components/profile/ProfileClient';
import type { Metadata } from 'next';

interface Props {
  params: { username: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const user = await prisma.user.findUnique({
    where: { username: params.username },
    select: { name: true, bio: true },
  });
  if (!user) return { title: 'User not found' };
  return {
    title: user.name,
    description: user.bio ?? `${user.name}'s profile on ISA Link`,
  };
}

export default async function ProfilePage({ params }: Props) {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { username: params.username },
    select: {
      id: true, name: true, username: true, avatarUrl: true, bio: true,
      role: true, isOnline: true, lastSeen: true, publicKey: true, createdAt: true,
      _count: { select: { posts: true } },
    },
  });

  if (!user) notFound();

  const friendship = await prisma.friendship.findFirst({
    where: {
      OR: [
        { userId: session.user.id, friendId: user.id },
        { userId: user.id, friendId: session.user.id },
      ],
    },
  });

  const posts = await prisma.post.findMany({
    where: { authorId: user.id, flagged: false },
    include: {
      author: { select: { id: true, name: true, username: true, avatarUrl: true, isOnline: true } },
      _count: { select: { likes: true, comments: true } },
      likes: { where: { userId: session.user.id }, select: { id: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  return (
    <ProfileClient
      profileUser={user}
      posts={posts.map((p) => ({ ...p, isLiked: p.likes.length > 0, createdAt: p.createdAt.toISOString() }))}
      currentUser={{ id: session.user.id, role: session.user.role }}
      friendship={friendship}
    />
  );
}
