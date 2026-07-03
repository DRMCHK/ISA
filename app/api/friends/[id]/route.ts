import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// PATCH /api/friends/[id] — accept or block a friend request
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { status } = (await req.json()) as { status: 'ACCEPTED' | 'BLOCKED' };

  const friendship = await prisma.friendship.findUnique({ where: { id: params.id } });
  if (!friendship) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Only the receiver can accept/block
  if (friendship.friendId !== session.user.id && session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const updated = await prisma.friendship.update({
    where: { id: params.id },
    data: { status },
  });

  return NextResponse.json({ friendship: updated });
}

// DELETE /api/friends/[id] — remove a friend / cancel request
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const friendship = await prisma.friendship.findUnique({ where: { id: params.id } });
  if (!friendship) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (friendship.userId !== session.user.id && friendship.friendId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await prisma.friendship.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
