import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@odim/database';
import { PayoutPage } from '@/components/creator/PayoutPage';

export default async function PayoutsPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  const creator = await prisma.creator.findUnique({
    where: { userId: session.user.id },
  });

  if (!creator) {
    redirect('/onboard');
  }

  const payouts = await prisma.payout.findMany({
    where: { creatorId: creator.id },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  return <PayoutPage creator={creator} payouts={payouts} />;
}

