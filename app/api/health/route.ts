import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/health
export async function GET() {
  return NextResponse.json({ status: 'ok', platform: 'ISA Link', version: '2.0.0' });
}
