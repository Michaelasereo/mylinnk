'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
  MapPin,
  Check,
  X,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { completeService, processRefund, rejectRefund } from '@/lib/actions/booking';

interface PriceListItem {
  id: string;
  name: string;
  category: string | null;
  price: number;
}

interface Booking {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  bookingDate: Date;
  totalAmount: number;
  firstPayoutAmount: number;
  secondPayoutAmount: number;
  status: string;
  notes: string | null;
  disputeReason: string | null;
  disputeStatus: string | null;
  trackingToken: string;
  priceListItem: PriceListItem;
  createdAt: Date;
}

interface Availability {
  id: string;
  date: Date;
  isAvailable: boolean;
  maxBookings: number | null;
}

interface BookingsDashboardProps {
  upcomingBookings: Booking[];
  disputedBookings: Booking[];
  completedBookings: Booking[];
  availability: Availability[];
  creatorId: string;
}

export function BookingsDashboard({
  upcomingBookings,
  disputedBookings,
  completedBookings,
  availability,
  creatorId,
}: BookingsDashboardProps) {
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isProcessingRefund, setIsProcessingRefund] = useState(false);

  const formatPrice = (priceInKobo: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(priceInKobo / 100);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-NG', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      pending: { label: 'Pending', variant: 'outline' },
      paid: { label: 'Paid', variant: 'default' },
      first_payout_done: { label: 'Confirmed', variant: 'default' },
      service_day: { label: 'Service Day', variant: 'default' },
      completed: { label: 'Completed', variant: 'secondary' },
      disputed: { label: 'Disputed', variant: 'destructive' },
      refunded: { label: 'Refunded', variant: 'secondary' },
      cancelled: { label: 'Cancelled', variant: 'secondary' },
    };
    const config = statusConfig[status] || { label: status, variant: 'outline' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  async function handleComplete(bookingId: string) {
    setIsCompleting(true);
    try {
      const result = await completeService(bookingId);
      if (result.success) {
        window.location.reload();
      } else {
        alert(result.error || 'Failed to complete service');
      }
    } catch (error) {
      alert('Failed to complete service');
    }
    setIsCompleting(false);
  }

  async function handleApproveRefund(bookingId: string) {
    setIsProcessingRefund(true);
    try {
      const result = await processRefund(bookingId);
      if (result.success) {
        window.location.reload();
      } else {
        alert(result.error || 'Failed to process refund');
      }
    } catch (error) {
      alert('Failed to process refund');
    }
    setIsProcessingRefund(false);
  }

  async function handleRejectRefund(bookingId: string) {
    setIsProcessingRefund(true);
    try {
      const result = await rejectRefund(bookingId);
      if (result.success) {
        window.location.reload();
      } else {
        alert(result.error || 'Failed to reject refund');
      }
    } catch (error) {
      alert('Failed to reject refund');
    }
    setIsProcessingRefund(false);
  }

  const BookingCard = ({ booking, showActions = false }: { booking: Booking; showActions?: boolean }) => (
    <Card
      className="cursor-pointer hover:border-primary/50 transition-colors"
      onClick={() => setSelectedBooking(booking)}
    >
      <CardContent className="pt-4">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold">{booking.priceListItem.name}</h4>
              {getStatusBadge(booking.status)}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-3 w-3" />
              {booking.customerName}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {formatDate(booking.bookingDate)}
            </div>
          </div>
          <div className="text-right">
            <p className="font-bold">{formatPrice(booking.totalAmount)}</p>
            {showActions && ['paid', 'first_payout_done', 'service_day'].includes(booking.status) && (
              <Button
                size="sm"
                className="mt-2"
                onClick={(e) => {
                  e.stopPropagation();
                  handleComplete(booking.id);
                }}
                disabled={isCompleting}
              >
                {isCompleting ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <>
                    <Check className="h-3 w-3 mr-1" />
                    Complete
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <>
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{upcomingBookings.length}</div>
            <p className="text-sm text-muted-foreground">Upcoming</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-destructive">{disputedBookings.length}</div>
            <p className="text-sm text-muted-foreground">Disputed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{completedBookings.length}</div>
            <p className="text-sm text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{availability.length}</div>
            <p className="text-sm text-muted-foreground">Available Dates</p>
          </CardContent>
        </Card>
      </div>

      {/* Bookings Tabs */}
      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">
            Upcoming ({upcomingBookings.length})
          </TabsTrigger>
          <TabsTrigger value="disputed">
            Disputed ({disputedBookings.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({completedBookings.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          {upcomingBookings.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No upcoming bookings
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {upcomingBookings.map((booking) => (
                <BookingCard key={booking.id} booking={booking} showActions />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="disputed" className="space-y-4">
          {disputedBookings.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No disputed bookings
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {disputedBookings.map((booking) => (
                <Card key={booking.id} className="border-destructive">
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                          <h4 className="font-semibold">{booking.priceListItem.name}</h4>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <p><strong>Customer:</strong> {booking.customerName}</p>
                          <p><strong>Date:</strong> {formatDate(booking.bookingDate)}</p>
                          <p><strong>Reason:</strong> {booking.disputeReason || 'No reason provided'}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="font-bold">{formatPrice(booking.totalAmount)}</p>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleApproveRefund(booking.id)}
                            disabled={isProcessingRefund}
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRejectRefund(booking.id)}
                            disabled={isProcessingRefund}
                          >
                            <X className="h-3 w-3 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completedBookings.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No completed bookings
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {completedBookings.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Booking Detail Dialog */}
      <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
        {selectedBooking && (
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{selectedBooking.priceListItem.name}</DialogTitle>
              <DialogDescription>
                Booking Details
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Status</span>
                {getStatusBadge(selectedBooking.status)}
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedBooking.customerName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedBooking.customerEmail}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedBooking.customerPhone}</span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span className="text-sm">{selectedBooking.customerAddress}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{formatDate(selectedBooking.bookingDate)}</span>
                </div>
              </div>

              {selectedBooking.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Customer Notes:</p>
                  <p className="text-sm">{selectedBooking.notes}</p>
                </div>
              )}

              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span>Total</span>
                  <span className="font-bold">{formatPrice(selectedBooking.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>First payout (60%)</span>
                  <span>{formatPrice(selectedBooking.firstPayoutAmount)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Second payout (40%)</span>
                  <span>{formatPrice(selectedBooking.secondPayoutAmount)}</span>
                </div>
              </div>
            </div>
            <DialogFooter>
              {['paid', 'first_payout_done', 'service_day'].includes(selectedBooking.status) && (
                <Button onClick={() => handleComplete(selectedBooking.id)} disabled={isCompleting}>
                  {isCompleting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Completing...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Mark as Complete
                    </>
                  )}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}

