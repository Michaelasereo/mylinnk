import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@odim/database';
import { OnboardingPrompt } from '@/components/ui/onboarding-prompt';

export default async function DashboardPage() {
  try {
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
      select: {
        id: true,
        username: true,
        displayName: true,
      },
    });

    // If user is a creator, redirect to creator dashboard
    if (creator) {
      redirect('/creator/dashboard');
    }

    // If user is not a creator, show onboarding prompt to become one
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <OnboardingPrompt
          userEmail={session.user.email || 'user'}
          completedSteps={0}
          totalSteps={4}
        />
      </div>
    );
  } catch (error) {
    console.error('Dashboard error:', error);
    // If there's any error, redirect to login
    redirect('/login');
  }
}
