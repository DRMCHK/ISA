import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/reports
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { type, content, anonymous } = (await req.json()) as {
    type: 'REPORT' | 'SUGGESTION';
    content: string;
    anonymous?: boolean;
  };

  if (!type || !content?.trim()) {
    return NextResponse.json({ error: 'Type and content required' }, { status: 400 });
  }

  const isAnonymous = anonymous !== false; // default to true
  const report = await prisma.report.create({
    data: {
      type,
      content: content.trim().slice(0, 3000),
      anonymous: isAnonymous,
      authorId: isAnonymous ? null : session.user.id,
    },
  });

  return NextResponse.json({ report }, { status: 201 });
}

// GET /api/reports — admin only
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }

  const reports = await prisma.report.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      author: { select: { id: true, name: true, username: true } },
    },
  });

  // Mask author info for anonymous reports
  const sanitized = reports.map((r) => ({
    ...r,
    author: r.anonymous ? null : r.author,
  }));

  return NextResponse.json({ reports: sanitized });
}
