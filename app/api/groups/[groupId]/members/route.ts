import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/groups/[groupId]/members — add a member (admin or moderator)
export async function POST(req: NextRequest, { params }: { params: { groupId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Check caller is admin or group moderator
  const callerMembership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId: params.groupId, userId: session.user.id } },
  });

  const isAdmin = session.user.role === 'ADMIN';
  const isModerator = callerMembership?.role === 'MODERATOR';

  if (!isAdmin && !isModerator) {
    return NextResponse.json({ error: 'Moderator or Admin required' }, { status: 403 });
  }

  const { userId, role } = (await req.json()) as { userId: string; role?: 'MEMBER' | 'MODERATOR' };

  const existing = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId: params.groupId, userId } },
  });

  if (existing) return NextResponse.json({ error: 'Already a member' }, { status: 409 });

  const member = await prisma.groupMember.create({
    data: { groupId: params.groupId, userId, role: role ?? 'MEMBER' },
    include: { user: { select: { id: true, name: true, username: true, avatarUrl: true } } },
  });

  return NextResponse.json({ member }, { status: 201 });
}

// DELETE /api/groups/[groupId]/members?userId=xxx
export async function DELETE(req: NextRequest, { params }: { params: { groupId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const targetUserId = searchParams.get('userId');
  if (!targetUserId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

  const callerMembership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId: params.groupId, userId: session.user.id } },
  });

  const isAdmin = session.user.role === 'ADMIN';
  const isSelf = targetUserId === session.user.id;
  const isModerator = callerMembership?.role === 'MODERATOR';

  if (!isAdmin && !isModerator && !isSelf) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await prisma.groupMember.delete({
    where: { groupId_userId: { groupId: params.groupId, userId: targetUserId } },
  });

  return NextResponse.json({ success: true });
}
