import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@odim/database';
import { CreatorDashboard } from '@/components/creator/Dashboard';
import {
  getCreatorAnalytics,
  getRecentSubscriptions,
  getContentMetrics,
} from '@/lib/actions/analytics';

export default async function CreatorDashboardPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  // Check if user is a creator
  const creator = await prisma.creator.findUnique({
    where: { userId: session.user.id },
  });

  if (!creator) {
    redirect('/onboard');
  }

  // Fetch data in parallel
  const [analytics, recentSubscriptions, contentMetrics] = await Promise.all([
    getCreatorAnalytics(creator.id),
    getRecentSubscriptions(creator.id),
    getContentMetrics(creator.id),
  ]);

  return (
    <CreatorDashboard
      creator={creator}
      analytics={analytics}
      recentSubscriptions={recentSubscriptions}
      contentMetrics={contentMetrics}
    />
  );
}

