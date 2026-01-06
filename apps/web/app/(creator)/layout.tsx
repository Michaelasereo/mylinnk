import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@odim/database';
import { CreatorSidebar } from '@/components/creator/CreatorSidebar';
import { OnboardingRequired } from '@/components/creator/OnboardingRequired';

export default async function CreatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
      avatarUrl: true,
    },
  });

  // If no creator account, show onboarding prompt instead of redirecting
  if (!creator) {
    return (
      <OnboardingRequired
        userEmail={session.user.email || 'user'}
        pageName="Creator Dashboard"
      />
    );
  }

  return (
    <div className="flex min-h-screen">
      <CreatorSidebar creator={creator} />
      <main className="flex-1 p-8 ml-64">{children}</main>
    </div>
  );
}

