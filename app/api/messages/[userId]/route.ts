import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/rate-limit';

// GET /api/messages/[userId] — load DM thread
export async function GET(req: NextRequest, { params }: { params: { userId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get('cursor');
  const take = 30;

  const myId = session.user.id;
  const otherId = params.userId;

  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: myId, receiverId: otherId },
        { senderId: otherId, receiverId: myId },
      ],
    },
    orderBy: { createdAt: 'desc' },
    take,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    include: {
      sender: { select: { id: true, name: true, avatarUrl: true } },
    },
  });

  // Fetch other user's public key so client can decrypt
  const otherUser = await prisma.user.findUnique({
    where: { id: otherId },
    select: { id: true, name: true, username: true, avatarUrl: true, isOnline: true, publicKey: true },
  });

  return NextResponse.json({
    messages: messages.reverse(),
    nextCursor: messages.length === take ? messages[0].id : null,
    otherUser,
  });
}

// POST /api/messages/[userId] — send a DM (stores ciphertext only)
export async function POST(req: NextRequest, { params }: { params: { userId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rateCheck = checkRateLimit(`msg:${session.user.id}`, 60, 60_000);
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  const { ciphertext, nonce } = (await req.json()) as { ciphertext: string; nonce: string };
  if (!ciphertext || !nonce) return NextResponse.json({ error: 'ciphertext and nonce required' }, { status: 400 });

  const message = await prisma.message.create({
    data: {
      ciphertext,
      nonce,
      senderId: session.user.id,
      receiverId: params.userId,
    },
    include: {
      sender: { select: { id: true, name: true, avatarUrl: true } },
    },
  });

  return NextResponse.json({ message }, { status: 201 });
}
