import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@odim/database';
import { CreatorDashboard } from '@/components/creator/Dashboard';
import { OnboardingPrompt } from '@/components/ui/onboarding-prompt';
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

  // If no creator account, show onboarding prompt instead of redirecting
  if (!creator) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <OnboardingPrompt
          userEmail={session.user.email || 'user'}
          completedSteps={0}
          totalSteps={4}
        />
      </div>
    );
  }

  // Fetch data in parallel for existing creators
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

