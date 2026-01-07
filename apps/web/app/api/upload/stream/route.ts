import { NextRequest, NextResponse } from 'next/server';
import { withCreatorSessionValidation } from '@/lib/auth/session-middleware';
import { withRateLimit, rateLimiters } from '@/lib/rate-limit/rate-limiter';
import MuxService from '@/lib/mux';

export async function POST(request: NextRequest) {
  return withCreatorSessionValidation(request, async (session, user) => {
    try {
      // Apply rate limiting for uploads (expensive operations)
      const rateLimitResult = await withRateLimit(request, rateLimiters.upload);

      if (!rateLimitResult.allowed) {
        return NextResponse.json(
          {
            error: 'Upload rate limit exceeded. Please try again later.',
            retryAfter: Math.ceil((rateLimitResult.result.resetTime - Date.now()) / 1000),
          },
          {
            status: 429,
            headers: {
              ...rateLimitResult.headers,
              'Retry-After': Math.ceil((rateLimitResult.result.resetTime - Date.now()) / 1000).toString(),
            },
          }
        );
      }

      const formData = await request.formData();
      const file = formData.get('file') as File;

      if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      }

      // Validate file type (video files only)
      if (!file.type.startsWith('video/')) {
        return NextResponse.json({ error: 'Only video files are allowed' }, { status: 400 });
      }

      // Validate file size (max 2GB for Mux)
      const maxSize = 2 * 1024 * 1024 * 1024; // 2GB
      if (file.size > maxSize) {
        return NextResponse.json({ error: 'File size exceeds 2GB limit' }, { status: 400 });
      }

      // Create Mux direct upload URL
      const uploadResult = await MuxService.createDirectUpload();

      return NextResponse.json(
        {
          muxAssetId: uploadResult.assetId,
          muxPlaybackId: uploadResult.playbackId,
          uploadUrl: uploadResult.uploadUrl,
          uploadId: uploadResult.uploadId,
        },
        { headers: rateLimitResult.headers }
      );
    } catch (error) {
      console.error('Error creating Mux upload:', error);
      return NextResponse.json(
        { error: 'Failed to create video upload' },
        { status: 500 }
      );
    }
  });
}

