import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/groups — list all groups the user is a member of
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const memberships = await prisma.groupMember.findMany({
    where: { userId: session.user.id },
    include: {
      group: {
        include: {
          _count: { select: { members: true, messages: true } },
        },
      },
    },
  });

  const groups = memberships.map((m) => ({ ...m.group, role: m.role }));
  return NextResponse.json({ groups });
}

// POST /api/groups — create a group (ADMIN only)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }

  const { name, description } = (await req.json()) as { name: string; description?: string };
  if (!name?.trim()) return NextResponse.json({ error: 'Group name required' }, { status: 400 });

  const group = await prisma.group.create({
    data: {
      name: name.trim(),
      description: description?.trim(),
      createdById: session.user.id,
      members: { create: { userId: session.user.id, role: 'MODERATOR' } },
    },
    include: { _count: { select: { members: true } } },
  });

  return NextResponse.json({ group }, { status: 201 });
}
