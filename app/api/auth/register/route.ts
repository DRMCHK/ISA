import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import bcrypt from 'bcryptjs';
import sanitizeHtml from 'sanitize-html';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateKeyPair } from '@/lib/encryption';
import { validateStrongPassword } from '@/lib/utils';
import { Role } from '@prisma/client';

// POST /api/auth/register
export async function POST(req: NextRequest) {
  const { email, password, name, username, publicKey } = (await req.json()) as {
    email: string;
    password: string;
    name: string;
    username: string;
    publicKey: string; // generated client-side
  };

  // Basic validation
  if (!email || !password || !name || !username || !publicKey) {
    return NextResponse.json({ error: 'All fields required' }, { status: 400 });
  }

  const sanitizedName = sanitizeHtml(name, { allowedTags: [], allowedAttributes: {} }).trim().slice(0, 100);
  const sanitizedUsername = username.trim().replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 30);
  const sanitizedEmail = email.trim().toLowerCase();

  if (!sanitizedUsername || sanitizedUsername.length < 3) {
    return NextResponse.json({ error: 'Username must be at least 3 characters (letters, numbers, _, -)' }, { status: 400 });
  }

  // Any user can register — password strength enforced for members too
  const pwError = validateStrongPassword(password);
  if (pwError) return NextResponse.json({ error: pwError }, { status: 400 });

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email: sanitizedEmail }, { username: sanitizedUsername }] },
  });
  if (existing) {
    return NextResponse.json({ error: 'Email or username already taken' }, { status: 409 });
  }

  const isFirstUser = (await prisma.user.count()) === 0;
  const adminEmail = process.env.ADMIN_SEED_EMAIL;
  const role: Role = isFirstUser || sanitizedEmail === adminEmail ? Role.ADMIN : Role.MEMBER;

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: { email: sanitizedEmail, passwordHash, name: sanitizedName, username: sanitizedUsername, publicKey, role },
    select: { id: true, email: true, name: true, username: true, role: true },
  });

  return NextResponse.json({ user }, { status: 201 });
}
