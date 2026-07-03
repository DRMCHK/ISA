import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { uploadToCloudinary } from '@/lib/cloudinary';

const MAX_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

// POST /api/upload — upload media to Cloudinary
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const contentLength = req.headers.get('content-length');
  if (contentLength && parseInt(contentLength) > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: 'File too large (max 50MB)' }, { status: 413 });
  }

  const { dataUri, folder } = (await req.json()) as { dataUri: string; folder?: string };
  if (!dataUri) return NextResponse.json({ error: 'dataUri required' }, { status: 400 });

  try {
    const result = await uploadToCloudinary(dataUri, folder ?? 'isa-link');
    return NextResponse.json({ url: result.url, publicId: result.publicId, resourceType: result.resourceType });
  } catch (err) {
    console.error('Cloudinary upload error:', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
