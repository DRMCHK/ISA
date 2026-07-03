import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/groups/[groupId]/messages
export async function GET(req: NextRequest, { params }: { params: { groupId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Verify membership
  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId: params.groupId, userId: session.user.id } },
  });
  if (!membership && session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Not a member' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get('cursor');
  const take = 30;

  const messages = await prisma.groupMessage.findMany({
    where: { groupId: params.groupId },
    include: {
      author: { select: { id: true, name: true, username: true, avatarUrl: true } },
    },
    orderBy: { createdAt: 'desc' },
    take,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
  });

  return NextResponse.json({ messages: messages.reverse(), nextCursor: messages.length === take ? messages[0].id : null });
}

// POST /api/groups/[groupId]/messages
export async function POST(req: NextRequest, { params }: { params: { groupId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId: params.groupId, userId: session.user.id } },
  });
  if (!membership) return NextResponse.json({ error: 'Not a member' }, { status: 403 });

  const { content } = (await req.json()) as { content: string };
  if (!content?.trim()) return NextResponse.json({ error: 'Content required' }, { status: 400 });

  const message = await prisma.groupMessage.create({
    data: { content: content.trim().slice(0, 2000), groupId: params.groupId, authorId: session.user.id },
    include: { author: { select: { id: true, name: true, username: true, avatarUrl: true } } },
  });

  return NextResponse.json({ message }, { status: 201 });
}
