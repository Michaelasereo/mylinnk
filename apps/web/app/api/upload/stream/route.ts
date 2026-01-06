import { NextRequest, NextResponse } from 'next/server';
import { withCreatorSessionValidation } from '@/lib/auth/session-middleware';
import { withRateLimit, rateLimiters } from '@/lib/rate-limit/rate-limiter';

const STREAM_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const STREAM_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const STREAM_BASE_URL = `https://api.cloudflare.com/client/v4/accounts/${STREAM_ACCOUNT_ID}/stream`;

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

    // Upload to Cloudflare Stream
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);

    const response = await fetch(STREAM_BASE_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${STREAM_API_TOKEN}`,
      },
      body: uploadFormData,
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.message || 'Failed to upload video' },
        { status: response.status }
      );
    }

      const data = await response.json();
      return NextResponse.json(
        {
          videoId: data.result.uid,
          thumbnail: data.result.thumbnail,
          playback: data.result.playback,
        },
        { headers: rateLimitResult.headers }
      );
    } catch (error) {
      console.error('Error uploading to Stream:', error);
      return NextResponse.json(
        { error: 'Failed to upload video' },
        { status: 500 }
      );
    }
  });
}

