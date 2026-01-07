'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, User, Mail, Phone } from 'lucide-react';

interface Booking {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  bookingDate: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  priceListItem: {
    name: string;
    price: number;
  };
}

interface BookingsListProps {
  bookings: Booking[];
}

export function BookingsList({ bookings }: BookingsListProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'confirmed':
      case 'paid':
        return 'secondary';
      case 'pending':
        return 'outline';
      case 'cancelled':
      case 'refunded':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount / 100); // Convert from kobo to naira
  };

  if (bookings.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500 mb-4">No bookings yet</p>
          <p className="text-sm text-gray-400">
            Customer bookings will appear here once they start booking your services.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Recent Bookings</h2>
        <p className="text-muted-foreground">
          Manage your customer bookings and appointments
        </p>
      </div>

      <div className="grid gap-4">
        {bookings.map((booking) => (
          <Card key={booking.id}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-lg">{booking.customerName}</h3>
                  <p className="text-sm text-gray-600">{booking.priceListItem.name}</p>
                </div>
                <Badge variant={getStatusColor(booking.status)}>
                  {booking.status}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span>{new Date(booking.bookingDate).toLocaleDateString()}</span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span>{new Date(booking.createdAt).toLocaleDateString()}</span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span className="truncate">{booking.customerEmail}</span>
                </div>

                {booking.customerPhone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span>{booking.customerPhone}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center">
                <div className="text-lg font-semibold text-green-600">
                  {formatCurrency(booking.totalAmount)}
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                  {booking.status === 'pending' && (
                    <Button size="sm">
                      Confirm Booking
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {bookings.length >= 10 && (
        <div className="text-center">
          <Button variant="outline">
            Load More Bookings
          </Button>
        </div>
      )}
    </div>
  );
}
