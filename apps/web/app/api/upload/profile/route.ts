import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';

const R2_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME;
const R2_PUBLIC_URL = process.env.CLOUDFLARE_R2_PUBLIC_URL;

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID!,
    secretAccessKey: R2_SECRET_ACCESS_KEY!,
  },
});

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  console.log('🎯 Profile upload API called');

  try {
    // Check environment variables first
    console.log('Checking R2 config...');
    console.log('R2_ACCOUNT_ID:', R2_ACCOUNT_ID ? 'SET' : 'MISSING');
    console.log('R2_ACCESS_KEY_ID:', R2_ACCESS_KEY_ID ? 'SET' : 'MISSING');
    console.log('R2_SECRET_ACCESS_KEY:', R2_SECRET_ACCESS_KEY ? 'SET' : 'MISSING');
    console.log('R2_BUCKET_NAME:', R2_BUCKET_NAME ? 'SET' : 'MISSING');
    console.log('R2_PUBLIC_URL:', R2_PUBLIC_URL ? 'SET' : 'MISSING');

    if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME || !R2_PUBLIC_URL) {
      console.error('❌ R2 environment variables not configured');
      return NextResponse.json(
        { error: 'Server configuration error: R2 not configured' },
        { status: 500 }
      );
    }

    // Authenticate user
    console.log('Authenticating user...');
    const supabase = await createRouteHandlerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError) {
      console.error('❌ Supabase auth error:', authError);
      return NextResponse.json(
        { error: 'Authentication error', details: authError.message },
        { status: 401 }
      );
    }

    if (!user) {
      console.error('❌ No user found');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log('✅ User authenticated:', user.id);

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const fileName = formData.get('fileName') as string;

    console.log('File received:', file?.name, file?.size, file?.type);

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      console.error('❌ Invalid file type:', file.type);
      return NextResponse.json(
        { error: 'Only image files are allowed' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      console.error('❌ File too large:', file.size);
      return NextResponse.json(
        { error: 'File size must be less than 10MB' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const uniqueFileName = `profile-${user.id}-${randomUUID()}.${fileExtension}`;

    console.log('Generated filename:', uniqueFileName);

    // For development/demo purposes, use a placeholder URL
    // TODO: Implement proper cloud storage (Cloudflare R2, Vercel Blob, etc.)
    const publicUrl = `https://via.placeholder.com/400x400/4ECDC4/FFFFFF?text=Profile+Image`;

    console.log('Using placeholder URL for development:', publicUrl);

    return NextResponse.json({
      url: publicUrl,
      fileName: uniqueFileName,
    });

  } catch (error) {
    console.error('❌ Profile image upload error:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);

    return NextResponse.json(
      {
        error: 'Failed to upload image',
        details: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
