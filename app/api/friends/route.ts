import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/friends — list friends (ACCEPTED)
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = session.user.id;

  const friendships = await prisma.friendship.findMany({
    where: {
      OR: [{ userId }, { friendId: userId }],
      status: 'ACCEPTED',
    },
    include: {
      user: { select: { id: true, name: true, username: true, avatarUrl: true, isOnline: true, lastSeen: true } },
      friend: { select: { id: true, name: true, username: true, avatarUrl: true, isOnline: true, lastSeen: true } },
    },
  });

  const pendingIncoming = await prisma.friendship.findMany({
    where: { friendId: userId, status: 'PENDING' },
    include: {
      user: { select: { id: true, name: true, username: true, avatarUrl: true } },
    },
  });

  const pendingOutgoing = await prisma.friendship.findMany({
    where: { userId, status: 'PENDING' },
    include: {
      friend: { select: { id: true, name: true, username: true, avatarUrl: true } },
    },
  });

  const friends = friendships.map((f) => (f.userId === userId ? f.friend : f.user));

  return NextResponse.json({ friends, pendingIncoming, pendingOutgoing });
}

// POST /api/friends — send friend request
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { targetUserId } = (await req.json()) as { targetUserId: string };
  if (!targetUserId || targetUserId === session.user.id) {
    return NextResponse.json({ error: 'Invalid target user' }, { status: 400 });
  }

  const existing = await prisma.friendship.findFirst({
    where: {
      OR: [
        { userId: session.user.id, friendId: targetUserId },
        { userId: targetUserId, friendId: session.user.id },
      ],
    },
  });

  if (existing) {
    return NextResponse.json({ error: 'Friend request already exists' }, { status: 409 });
  }

  const friendship = await prisma.friendship.create({
    data: { userId: session.user.id, friendId: targetUserId, status: 'PENDING' },
  });

  return NextResponse.json({ friendship }, { status: 201 });
}
