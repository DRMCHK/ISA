import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/admin/posts — flagged posts
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }

  const posts = await prisma.post.findMany({
    where: { flagged: true },
    include: {
      author: { select: { id: true, name: true, username: true, avatarUrl: true } },
      _count: { select: { likes: true, comments: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ posts });
}
