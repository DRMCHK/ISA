import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/posts/[id]/like — toggle like
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const existing = await prisma.like.findUnique({
    where: { postId_userId: { postId: params.id, userId: session.user.id } },
  });

  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } });
    const count = await prisma.like.count({ where: { postId: params.id } });
    return NextResponse.json({ liked: false, count });
  } else {
    await prisma.like.create({ data: { postId: params.id, userId: session.user.id } });
    const count = await prisma.like.count({ where: { postId: params.id } });
    return NextResponse.json({ liked: true, count });
  }
}
