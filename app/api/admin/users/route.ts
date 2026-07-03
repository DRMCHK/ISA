import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import bcrypt from 'bcryptjs';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { validateStrongPassword } from '@/lib/utils';
import { generateKeyPair } from '@/lib/encryption';

// GET /api/admin/users
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    select: {
      id: true, email: true, name: true, username: true,
      role: true, isOnline: true, lastSeen: true, createdAt: true, avatarUrl: true,
      _count: { select: { posts: true, sentMessages: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ users });
}

// POST /api/admin/users — create account (admin can create ADMIN accounts)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }

  const { email, name, username, password, role } = (await req.json()) as {
    email: string; name: string; username: string; password: string; role?: 'MEMBER' | 'ADMIN';
  };

  // Strong password required for all accounts
  const pwError = validateStrongPassword(password);
  if (pwError) return NextResponse.json({ error: pwError }, { status: 400 });

  const existing = await prisma.user.findFirst({ where: { OR: [{ email }, { username }] } });
  if (existing) return NextResponse.json({ error: 'Email or username already taken' }, { status: 409 });

  const passwordHash = await bcrypt.hash(password, 12);
  const { publicKey } = generateKeyPair();

  const user = await prisma.user.create({
    data: { email, name, username, passwordHash, role: role ?? 'MEMBER', publicKey },
    select: { id: true, email: true, name: true, username: true, role: true, createdAt: true },
  });

  return NextResponse.json({ user }, { status: 201 });
}

// PATCH /api/admin/users — update user role or ban
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }

  const { userId, role } = (await req.json()) as { userId: string; role: 'MEMBER' | 'ADMIN' };
  const user = await prisma.user.update({
    where: { id: userId },
    data: { role },
    select: { id: true, name: true, role: true },
  });

  return NextResponse.json({ user });
}

// DELETE /api/admin/users?userId=xxx — delete user
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });
  if (userId === session.user.id) return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 });

  await prisma.user.delete({ where: { id: userId } });
  return NextResponse.json({ success: true });
}
