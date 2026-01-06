import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@odim/database';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const creator = await prisma.creator.findUnique({
      where: { userId: session.user.id },
      include: {
        introVideo: {
          select: {
            id: true,
            title: true,
            videoId: true,
            thumbnailUrl: true,
          },
        },
        collections: {
          where: { isPublished: true },
          select: {
            id: true,
            title: true,
            description: true,
            price: true,
            subscriptionPrice: true,
            subscriptionType: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!creator) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
    }

    // Convert BigInt fields to strings to avoid serialization issues
    const serializedCreator = {
      ...creator,
      totalEarnings: creator.totalEarnings.toString(),
      currentBalance: creator.currentBalance.toString(),
    };

    const serializedCollections = creator.collections.map(collection => ({
      ...collection,
      price: collection.price?.toString(),
      subscriptionPrice: collection.subscriptionPrice?.toString(),
    }));

    return NextResponse.json({
      creator: serializedCreator,
      collections: serializedCollections
    });
  } catch (error) {
    console.error('Error getting creator:', error);
    return NextResponse.json(
      { error: 'Failed to get creator' },
      { status: 500 }
    );
  }
}

