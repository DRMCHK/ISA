import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import sanitizeHtml from 'sanitize-html';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/users/me
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true, email: true, name: true, username: true,
      avatarUrl: true, bio: true, role: true, isOnline: true, publicKey: true, createdAt: true,
    },
  });

  return NextResponse.json({ user });
}

// PATCH /api/users/me — update profile
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name, bio, avatarUrl } = (await req.json()) as { name?: string; bio?: string; avatarUrl?: string };

  const data: Record<string, string> = {};
  if (name) data.name = sanitizeHtml(name, { allowedTags: [], allowedAttributes: {} }).trim().slice(0, 100);
  if (bio !== undefined) data.bio = sanitizeHtml(bio, { allowedTags: [], allowedAttributes: {} }).trim().slice(0, 500);
  if (avatarUrl) data.avatarUrl = avatarUrl;

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data,
    select: { id: true, name: true, bio: true, avatarUrl: true },
  });

  return NextResponse.json({ user });
}
