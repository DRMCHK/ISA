import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { moderatePost } from '@/lib/moderation';
import { checkRateLimit } from '@/lib/rate-limit';
import { stripHtml } from '@/lib/utils';

// GET /api/posts — feed (friends' posts, chronological)
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get('cursor');
  const take = 15;

  // Get accepted friends
  const friendships = await prisma.friendship.findMany({
    where: {
      OR: [{ userId: session.user.id }, { friendId: session.user.id }],
      status: 'ACCEPTED',
    },
    select: { userId: true, friendId: true },
  });

  const friendIds = friendships.map((f) =>
    f.userId === session.user.id ? f.friendId : f.userId
  );

  const authorIds = [session.user.id, ...friendIds];

  const posts = await prisma.post.findMany({
    where: { authorId: { in: authorIds }, flagged: false },
    include: {
      author: { select: { id: true, name: true, username: true, avatarUrl: true, isOnline: true } },
      _count: { select: { likes: true, comments: true } },
      likes: { where: { userId: session.user.id }, select: { id: true } },
    },
    orderBy: { createdAt: 'desc' },
    take,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
  });

  const nextCursor = posts.length === take ? posts[posts.length - 1].id : null;

  return NextResponse.json({
    posts: posts.map((p) => ({ ...p, isLiked: p.likes.length > 0 })),
    nextCursor,
  });
}

// POST /api/posts — create a post
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rateCheck = checkRateLimit(session.user.id);
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded. Please slow down.' }, { status: 429 });
  }

  const body = (await req.json()) as {
    content?: string;
    mediaUrl?: string;
    mediaType?: string;
    linkUrl?: string;
  };

  // Replace sanitize-html with our lightweight stripHtml utility
  const content = body.content ? stripHtml(body.content).slice(0, 5000) : null;
  const { flagged, reason } = await moderatePost(content, body.linkUrl ?? null);

  const post = await prisma.post.create({
    data: {
      content: content ?? undefined,
      mediaUrl: body.mediaUrl,
      mediaType: body.mediaType,
      linkUrl: body.linkUrl,
      flagged,
      authorId: session.user.id,
    },
    include: {
      author: { select: { id: true, name: true, username: true, avatarUrl: true, isOnline: true } },
      _count: { select: { likes: true, comments: true } },
    },
  });

  if (flagged) {
    console.warn(`Post ${post.id} flagged: ${reason}`);
  }

  return NextResponse.json({ post, flagged, flagReason: reason }, { status: 201 });
}
