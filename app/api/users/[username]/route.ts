import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/users/[username]
export async function GET(req: NextRequest, { params }: { params: { username: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { username: params.username },
    select: {
      id: true, name: true, username: true, avatarUrl: true,
      bio: true, role: true, isOnline: true, lastSeen: true, publicKey: true, createdAt: true,
      _count: { select: { posts: true, friends: true } },
    },
  });

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  // Check if the viewer is friends with this user (for presence disclosure)
  const friendship = await prisma.friendship.findFirst({
    where: {
      status: 'ACCEPTED',
      OR: [
        { userId: session.user.id, friendId: user.id },
        { userId: user.id, friendId: session.user.id },
      ],
    },
  });

  const isFriend = !!friendship || user.id === session.user.id;

  // Only reveal online status to friends
  return NextResponse.json({
    user: {
      ...user,
      isOnline: isFriend ? user.isOnline : undefined,
      lastSeen: isFriend ? user.lastSeen : undefined,
    },
    isFriend,
    isOwnProfile: user.id === session.user.id,
  });
}
