import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@odim/database';
import { PriceListManager } from '@/components/creator/PriceListManager';

export default async function PriceListPage() {
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

  const priceListItems = await prisma.priceListItem.findMany({
    where: { creatorId: creator.id },
    orderBy: [
      { categoryOrderIndex: 'asc' },
      { orderIndex: 'asc' },
    ],
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Price List</h1>
        <p className="text-muted-foreground">
          Manage your service offerings and prices for bookings
        </p>
      </div>

      <PriceListManager creatorId={creator.id} initialPriceList={priceListItems} />
    </div>
  );
}

