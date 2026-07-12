import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { generateKeyPair } from '@/lib/encryption';
import { validateStrongPassword, stripHtml } from '@/lib/utils';
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

  // Replace sanitize-html with lightweight stripHtml + username regex cleanup
  const sanitizedName = stripHtml(name).trim().slice(0, 100);
  const sanitizedUsername = username.trim().replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 30);
  const sanitizedEmail = email.trim().toLowerCase();

  if (!sanitizedUsername || sanitizedUsername.length < 3) {
    return NextResponse.json({ error: 'Username must be at least 3 characters (letters, numbers, _, -)' }, { status: 400 });
  }

  // Password strength enforced for all users
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
