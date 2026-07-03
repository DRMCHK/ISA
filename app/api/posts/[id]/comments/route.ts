import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/posts/[id]/comments
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const comments = await prisma.comment.findMany({
    where: { postId: params.id },
    include: {
      author: { select: { id: true, name: true, username: true, avatarUrl: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json({ comments });
}

// POST /api/posts/[id]/comments
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { content } = (await req.json()) as { content: string };
  if (!content?.trim()) return NextResponse.json({ error: 'Content required' }, { status: 400 });

  const post = await prisma.post.findUnique({ where: { id: params.id } });
  if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

  const comment = await prisma.comment.create({
    data: { content: content.trim().slice(0, 1000), postId: params.id, authorId: session.user.id },
    include: {
      author: { select: { id: true, name: true, username: true, avatarUrl: true } },
    },
  });

  return NextResponse.json({ comment }, { status: 201 });
}
