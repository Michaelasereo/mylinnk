import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@odim/database';
import { redirect } from 'next/navigation';
import { BookingDashboard } from '@/components/booking/BookingDashboard';

export default async function BookingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get creator
  const creator = await prisma.creator.findUnique({
    where: { userId: user.id }
  });

  if (!creator) {
    redirect('/dashboard');
  }

  // Get services and availability data
  const services = await prisma.priceListItem.findMany({
    where: { creatorId: creator.id },
    include: {
      _count: {
        select: {
          bookings: true
        }
      }
    },
    orderBy: [
      { categoryOrderIndex: 'asc' },
      { orderIndex: 'asc' }
    ]
  });

  // Get recent bookings
  const recentBookings = await prisma.booking.findMany({
    where: { creatorId: creator.id },
    include: {
      priceListItem: {
        select: {
          name: true,
          price: true
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 10
  });

  // Get availability for next 30 days
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  const availability = await prisma.creatorAvailability.findMany({
    where: {
      creatorId: creator.id,
      date: {
        gte: new Date(),
        lte: thirtyDaysFromNow
      }
    },
    orderBy: { date: 'asc' }
  });

  return (
    <div className="max-w-7xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Booking Management
        </h1>
        <p className="text-gray-600">
          Manage your services, availability, and customer bookings
        </p>
      </div>

      <Suspense fallback={<BookingLoading />}>
        <BookingDashboard
          creator={creator}
          services={services}
          recentBookings={recentBookings}
          availability={availability}
        />
      </Suspense>
    </div>
  );
}

function BookingLoading() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-lg shadow p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-4 bg-gray-200 rounded w-full"></div>
          ))}
        </div>
      </div>
    </div>
  );
}
