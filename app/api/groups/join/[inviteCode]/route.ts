import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/groups/join/[inviteCode] — join group via invite link
export async function POST(req: NextRequest, { params }: { params: { inviteCode: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const group = await prisma.group.findUnique({ where: { inviteCode: params.inviteCode } });
  if (!group) return NextResponse.json({ error: 'Invalid invite code' }, { status: 404 });

  const existing = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId: group.id, userId: session.user.id } },
  });

  if (existing) return NextResponse.json({ group, alreadyMember: true });

  await prisma.groupMember.create({
    data: { groupId: group.id, userId: session.user.id, role: 'MEMBER' },
  });

  return NextResponse.json({ group }, { status: 201 });
}
