import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/groups/[groupId]
export async function GET(req: NextRequest, { params }: { params: { groupId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const group = await prisma.group.findUnique({
    where: { id: params.groupId },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, username: true, avatarUrl: true, isOnline: true } } },
        orderBy: { joinedAt: 'asc' },
      },
    },
  });

  if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });

  return NextResponse.json({ group });
}
