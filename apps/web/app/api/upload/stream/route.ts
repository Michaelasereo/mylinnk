import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/server';
import { prisma } from '@odim/database';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes for large uploads

export async function POST(request: Request) {
  console.log('📤 Upload API called');

  try {
    // 1. Initialize Supabase client
    const supabase = await createRouteHandlerClient();

    // 2. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError) {
      console.error('❌ Auth error:', authError);
      return NextResponse.json(
        { error: 'Authentication failed', details: authError.message },
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

    console.log(`✅ User authenticated: ${user.id} (${user.email})`);

    // 3. Get or create creator
    let creator = await prisma.creator.findUnique({
      where: { userId: user.id }
    });

    if (!creator) {
      console.log(`🆕 Creating creator for user ${user.id}`);
      creator = await prisma.creator.create({
        data: {
          userId: user.id,
          username: user.email?.split('@')[0] || `user_${user.id.slice(0, 8)}`,
          displayName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'New Creator',
          email: user.email || '',
          balance: 0,
          pendingBalance: 0,
          totalEarnings: 0,
          payoutThreshold: 500000,
          currentBalance: 0,
          trustScore: 100
        }
      });
    }

    console.log(`✅ Creator: ${creator.id}`);

    // 4. Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    console.log(`📁 File: ${file.name} (${file.size} bytes, ${file.type})`);

    // 5. Basic validation
    if (file.size === 0) {
      return NextResponse.json(
        { error: 'File is empty' },
        { status: 400 }
      );
    }

    if (file.size > 100 * 1024 * 1024) { // 100MB limit
      return NextResponse.json(
        { error: 'File too large. Maximum size: 100MB' },
        { status: 400 }
      );
    }

    // Check file type
    const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `Unsupported file type: ${file.type}. Allowed: MP4, WebM, MOV, MKV` },
        { status: 400 }
      );
    }

    // 6. Create upload record
    const uploadId = `upl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await prisma.upload.create({
      data: {
        id: uploadId,
        userId: user.id,
        creatorId: creator.id,
        filename: file.name,
        mimeType: file.type,
        size: file.size,
        status: 'UPLOADING', // ← FIXED: Use correct enum value (UPLOADING, not 'uploading')
        metadata: {
          originalName: file.name,
          size: file.size,
          type: file.type
        }
      }
    });

    console.log(`✅ Upload record created: ${uploadId}`);

    // 7. Simple Mux upload (direct, no queue for now)
    const muxToken = Buffer.from(
      `${process.env.MUX_TOKEN_ID}:${process.env.MUX_TOKEN_SECRET}`
    ).toString('base64');

    // Create Mux direct upload URL
    const muxResponse = await fetch('https://api.mux.com/video/v1/uploads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${muxToken}`
      },
      body: JSON.stringify({
        cors_origin: '*',
        new_asset_settings: {
          playback_policy: ['public'],
          mp4_support: 'standard',
          encoding_tier: 'smart'
        }
      })
    });

    if (!muxResponse.ok) {
      const errorText = await muxResponse.text();
      console.error('❌ Mux API error:', errorText);

      // Update upload status to failed
      await prisma.upload.update({
        where: { id: uploadId },
        data: {
          status: 'FAILED', // ← FIXED: Use correct enum value (FAILED, not 'failed')
          error: `Mux API error: ${muxResponse.status}`,
          failedAt: new Date()
        }
      });

      throw new Error(`Mux API error: ${muxResponse.status} - ${errorText}`);
    }

    const muxData = await muxResponse.json();
    const uploadUrl = muxData.data.url;
    const muxUploadId = muxData.data.id;
    const assetId = muxData.data.asset_id;
    const playbackId = muxData.data.playback_ids?.[0]?.id;

    console.log(`✅ Mux upload created: ${muxUploadId}`);
    console.log(`📤 Uploading to: ${uploadUrl}`);

    // 8. Upload file to Mux
    const fileBuffer = await file.arrayBuffer();
    const uploadResult = await fetch(uploadUrl, {
      method: 'PUT',
      body: fileBuffer,
      headers: {
        'Content-Type': file.type
      }
    });

    if (!uploadResult.ok) {
      throw new Error(`File upload failed: ${uploadResult.status}`);
    }

    console.log('✅ File uploaded to Mux');

    // 9. Update database with success
    await prisma.upload.update({
      where: { id: uploadId },
      data: {
        status: 'COMPLETED', // ← FIXED: Use correct enum value (COMPLETED, not 'completed')
        muxAssetId: assetId,
        muxPlaybackId: playbackId,
        url: `https://stream.mux.com/${playbackId}.m3u8`,
        completedAt: new Date()
      }
    });

    // 10. Create content record
    const content = await prisma.content.create({
      data: {
        title: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
        description: '',
        type: 'video',
        // NO price field - it doesn't exist in your Prisma schema!
        creatorId: creator.id,
        uploadId: uploadId,
        isPublished: false,
        metadata: {
          duration: 0, // Will be updated when Mux processes it
          aspectRatio: '16:9',
          resolution: '1920x1080'
        }
      }
    });

    console.log(`✅ Content created: ${content.id}`);

    // 11. Return success
    return NextResponse.json({
      success: true,
      message: 'Upload successful',
      data: {
        uploadId,
        contentId: content.id,
        playbackUrl: `https://stream.mux.com/${playbackId}.m3u8`,
        assetId,
        playbackId
      }
    });

  } catch (error: any) {
    console.error('❌ Upload API error:', error);

    return NextResponse.json(
      {
        error: 'Upload failed',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

