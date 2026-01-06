import { NextRequest, NextResponse } from 'next/server';
import { withCreatorSessionValidation } from '@/lib/auth/session-middleware';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

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

export async function POST(request: NextRequest) {
  return withCreatorSessionValidation(request, async (session, user) => {
    try {

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const fileName = formData.get('fileName') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedFileName = fileName || file.name;
    const fileExtension = sanitizedFileName.split('.').pop();
    const uniqueFileName = `${session.user.id}/${timestamp}-${sanitizedFileName}`;

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to R2
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME!,
      Key: uniqueFileName,
      Body: buffer,
      ContentType: file.type,
    });

    await s3Client.send(command);

    // Return public URL
    const publicUrl = R2_PUBLIC_URL
      ? `${R2_PUBLIC_URL}/${uniqueFileName}`
      : `https://pub-${R2_ACCOUNT_ID}.r2.dev/${R2_BUCKET_NAME}/${uniqueFileName}`;

      return NextResponse.json({ url: publicUrl, fileName: uniqueFileName });
    } catch (error) {
      console.error('Error uploading to R2:', error);
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      );
    }
  });
}

export async function DELETE(request: NextRequest) {
  return withCreatorSessionValidation(request, async (session, user) => {
    try {

    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get('fileName');

    if (!fileName) {
      return NextResponse.json({ error: 'No file name provided' }, { status: 400 });
    }

    // Verify the file belongs to the user
    if (!fileName.startsWith(`${session.user.id}/`)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
    const command = new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME!,
      Key: fileName,
    });

    await s3Client.send(command);

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Error deleting from R2:', error);
      return NextResponse.json(
        { error: 'Failed to delete file' },
        { status: 500 }
      );
    }
  });
}

