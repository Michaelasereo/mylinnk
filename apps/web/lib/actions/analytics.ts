'use server';

import { createClient } from '@/lib/supabase/server';
import { prisma } from '@odim/database';
import { serializePrismaObject } from '@/lib/utils/serialization';

export async function getCreatorAnalytics(creatorId: string) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return null;
  }

  try {
    const creator = await prisma.creator.findUnique({
      where: { id: creatorId, userId: session.user.id },
    });

    if (!creator) {
      return null;
    }

    // Get content stats
    const contentStats = await prisma.content.aggregate({
      where: { creatorId },
      _sum: { viewCount: true },
      _count: { id: true },
    });

    // Get subscription stats
    const subscriptionStats = await prisma.fanSubscription.aggregate({
      where: { creatorId, status: 'active' },
      _count: { id: true },
    });

    // Get recent transactions
    const recentTransactions = await prisma.transaction.findMany({
      where: {
        creatorId,
        status: 'success',
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const totalRevenue = recentTransactions.reduce(
      (sum: number, t: { netAmount: number | null }) => sum + Number(t.netAmount || 0),
      0
    );

    const result = {
      totalViews: contentStats._sum.viewCount || 0,
      contentCount: contentStats._count.id || 0,
      subscriberCount: subscriptionStats._count.id || 0,
      totalRevenue,
      recentTransactions,
    };

    // Serialize all Prisma special types
    return serializePrismaObject(result);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return null;
  }
}

export async function getRecentSubscriptions(creatorId: string) {
  try {
    const subscriptions = await prisma.fanSubscription.findMany({
      where: { creatorId, status: 'active' },
      include: {
        fan: {
          select: {
            fullName: true,
            email: true,
          },
        },
        plan: {
          select: {
            name: true,
            price: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Serialize all Prisma special types
    return serializePrismaObject(subscriptions);
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return [];
  }
}

export async function getContentMetrics(creatorId: string) {
  try {
    const topContent = await prisma.content.findMany({
      where: { creatorId, isPublished: true },
      orderBy: { viewCount: 'desc' },
      take: 5,
      select: {
        id: true,
        title: true,
        type: true,
        viewCount: true,
        likeCount: true,
        createdAt: true,
      },
    });

    // Serialize all Prisma special types
    return serializePrismaObject({ topContent });
  } catch (error) {
    console.error('Error fetching content metrics:', error);
    return { topContent: [] };
  }
}

