import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/admin/reports — all reports (author hidden if anonymous)
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }

  const reports = await prisma.report.findMany({
    orderBy: { createdAt: 'desc' },
    include: { author: { select: { id: true, name: true, username: true } } },
  });

  return NextResponse.json({
    reports: reports.map((r) => ({ ...r, author: r.anonymous ? null : r.author })),
  });
}
