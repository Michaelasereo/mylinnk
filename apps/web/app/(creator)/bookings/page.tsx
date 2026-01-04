import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@odim/database';
import { BookingsDashboard } from '@/components/creator/BookingsDashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AvailabilityTab } from '@/components/creator/AvailabilityTab';

export default async function BookingsPage() {
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

  // Fetch bookings
  const bookings = await prisma.booking.findMany({
    where: { creatorId: creator.id },
    include: {
      priceListItem: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  // Fetch availability
  const availability = await prisma.creatorAvailability.findMany({
    where: {
      creatorId: creator.id,
      date: {
        gte: new Date(),
      },
    },
    orderBy: { date: 'asc' },
  });

  // Separate bookings by status
  const upcomingBookings = bookings.filter(
    (b: typeof bookings[0]) => ['paid', 'first_payout_done', 'service_day'].includes(b.status)
  );
  const disputedBookings = bookings.filter((b: typeof bookings[0]) => b.status === 'disputed');
  const completedBookings = bookings.filter(
    (b: typeof bookings[0]) => ['completed', 'refunded', 'cancelled'].includes(b.status)
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Bookings</h1>
        <p className="text-muted-foreground">
          Manage your bookings and availability
        </p>
      </div>

      <Tabs defaultValue="bookings" className="w-full">
        <TabsList>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="availability">Availability</TabsTrigger>
        </TabsList>
        <TabsContent value="bookings" className="mt-6">
          <BookingsDashboard
            upcomingBookings={upcomingBookings}
            disputedBookings={disputedBookings}
            completedBookings={completedBookings}
            availability={availability}
            creatorId={creator.id}
          />
        </TabsContent>
        <TabsContent value="availability" className="mt-6">
          <AvailabilityTab
            creatorId={creator.id}
            initialAvailability={availability}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
