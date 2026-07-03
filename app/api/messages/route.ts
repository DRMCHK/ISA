import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/rate-limit';

// GET /api/messages — list DM conversations (last message per conversation)
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = session.user.id;

  // Get all messages involving user, grouped to find unique conversation partners
  const messages = await prisma.message.findMany({
    where: { OR: [{ senderId: userId }, { receiverId: userId }] },
    orderBy: { createdAt: 'desc' },
    include: {
      sender: { select: { id: true, name: true, username: true, avatarUrl: true, isOnline: true } },
      receiver: { select: { id: true, name: true, username: true, avatarUrl: true, isOnline: true } },
    },
  });

  // De-duplicate: keep only the latest message per conversation partner
  const conversationMap = new Map<string, (typeof messages)[0]>();
  for (const msg of messages) {
    const partnerId = msg.senderId === userId ? msg.receiverId : msg.senderId;
    if (!conversationMap.has(partnerId)) {
      conversationMap.set(partnerId, msg);
    }
  }

  const conversations = Array.from(conversationMap.values()).map((msg) => {
    const partner = msg.senderId === userId ? msg.receiver : msg.sender;
    return { partner, lastMessage: { id: msg.id, createdAt: msg.createdAt, isMine: msg.senderId === userId } };
  });

  return NextResponse.json({ conversations });
}
