import { NextResponse } from 'next/server';

// GET /api/health — used by Render health check
export async function GET() {
  return NextResponse.json(
    { status: 'ok', platform: 'ISA Link', version: '2.0.0', timestamp: new Date().toISOString() },
    { status: 200 }
  );
}
