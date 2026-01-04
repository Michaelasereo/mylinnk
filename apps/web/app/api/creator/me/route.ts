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

    return NextResponse.json({ creator, collections: creator.collections });
  } catch (error) {
    console.error('Error getting creator:', error);
    return NextResponse.json(
      { error: 'Failed to get creator' },
      { status: 500 }
    );
  }
}

