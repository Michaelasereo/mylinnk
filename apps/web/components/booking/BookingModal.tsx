'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar, Clock, ArrowLeft, Check, Loader2 } from 'lucide-react';

interface PriceListItem {
  id: string;
  category: string | null;
  name: string;
  description: string | null;
  price: number;
  durationMinutes: number | null;
}

interface AvailabilityDate {
  id: string;
  date: Date;
  isAvailable: boolean;
}

interface BookingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedService: PriceListItem;
  creatorId: string;
  creatorName: string;
  availableDates: AvailabilityDate[];
  onBack: () => void;
}

const bookingSchema = z.object({
  customerName: z.string().min(2, 'Name is required'),
  customerEmail: z.string().email('Valid email is required'),
  customerPhone: z.string().min(10, 'Phone number is required (for WhatsApp and calls)'),
  customerAddress: z.string().min(10, 'Address is required for service delivery'),
  bookingDate: z.string().min(1, 'Please select a date'),
  notes: z.string().optional(),
});

type BookingInput = z.infer<typeof bookingSchema>;

type Step = 'service' | 'date' | 'details' | 'payment' | 'success';

export function BookingModal({
  open,
  onOpenChange,
  selectedService,
  creatorId,
  creatorName,
  availableDates,
  onBack,
}: BookingModalProps) {
  const [step, setStep] = useState<Step>('service');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingResult, setBookingResult] = useState<{
    trackingToken?: string;
    bookingId?: string;
  } | null>(null);

  const form = useForm<BookingInput>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      customerAddress: '',
      bookingDate: '',
      notes: '',
    },
  });

  const formatPrice = (priceInKobo: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(priceInKobo / 100);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-NG', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const stepProgress = {
    service: 20,
    date: 40,
    details: 60,
    payment: 80,
    success: 100,
  };

  async function handleDateSelect(dateStr: string) {
    setSelectedDate(dateStr);
    form.setValue('bookingDate', dateStr);
    setStep('details');
  }

  async function onSubmit(data: BookingInput) {
    setIsSubmitting(true);
    try {
      // Create booking
      const response = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorId,
          priceListItemId: selectedService.id,
          customerEmail: data.customerEmail,
          customerName: data.customerName,
          customerPhone: data.customerPhone,
          customerAddress: data.customerAddress,
          bookingDate: data.bookingDate,
          notes: data.notes,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create booking');
      }

      setBookingResult({
        trackingToken: result.trackingToken,
        bookingId: result.booking.id,
      });
      
      // Proceed to payment
      setStep('payment');

      // Initialize Paystack payment
      await initializePayment(result.booking, data);
    } catch (error) {
      console.error('Error creating booking:', error);
      alert(error instanceof Error ? error.message : 'Failed to create booking');
    }
    setIsSubmitting(false);
  }

  async function initializePayment(booking: any, customerData: BookingInput) {
    // Initialize Paystack popup
    const paystackKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
    
    if (!paystackKey) {
      // For development/testing without Paystack
      console.log('No Paystack key, simulating payment...');
      
      // Simulate successful payment
      setTimeout(async () => {
        try {
          const verifyResponse = await fetch('/api/bookings/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              reference: `test_ref_${Date.now()}`,
              bookingId: booking.id,
            }),
          });
          
          if (verifyResponse.ok) {
            setStep('success');
          }
        } catch (e) {
          console.error('Payment verification error:', e);
        }
      }, 1000);
      return;
    }

    // @ts-ignore - Paystack is loaded from script
    const handler = window.PaystackPop?.setup({
      key: paystackKey,
      email: customerData.customerEmail,
      amount: booking.totalAmount, // already in kobo
      currency: 'NGN',
      ref: `booking_${booking.id}_${Date.now()}`,
      metadata: {
        type: 'booking',
        bookingId: booking.id,
        custom_fields: [
          {
            display_name: 'Service',
            variable_name: 'service',
            value: selectedService.name,
          },
        ],
      },
      callback: async (response: { reference: string }) => {
        try {
          const verifyResponse = await fetch('/api/bookings/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              reference: response.reference,
              bookingId: booking.id,
            }),
          });

          if (verifyResponse.ok) {
            setStep('success');
          } else {
            alert('Payment verification failed. Please contact support.');
          }
        } catch (e) {
          console.error('Payment verification error:', e);
          alert('Payment verification failed. Please contact support.');
        }
      },
      onClose: () => {
        // User closed the payment modal
        setStep('details');
      },
    });

    handler?.openIframe();
  }

  function handleClose() {
    if (step === 'success') {
      onOpenChange(false);
      // Reset state
      setStep('service');
      setSelectedDate(null);
      setBookingResult(null);
      form.reset();
    } else {
      onOpenChange(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>
            {step === 'success' ? 'Booking Confirmed!' : 'Book Service'}
          </DialogTitle>
          <DialogDescription>
            {step === 'success'
              ? `Your booking with ${creatorName} is confirmed`
              : `Complete your booking with ${creatorName}`}
          </DialogDescription>
        </DialogHeader>

        {/* Progress bar */}
        {step !== 'success' && (
          <Progress value={stepProgress[step]} className="h-2 flex-shrink-0" />
        )}

        <div className="flex-1 overflow-y-auto min-h-0">
        {/* Step: Service Summary */}
        {step === 'service' && (
          <div className="space-y-4 py-4">
            <div className="bg-muted p-4 rounded-lg space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold">{selectedService.name}</h4>
                  {selectedService.category && (
                    <Badge variant="outline" className="mt-1">
                      {selectedService.category}
                    </Badge>
                  )}
                </div>
                <span className="font-bold text-lg text-primary">
                  {formatPrice(selectedService.price)}
                </span>
              </div>
              {selectedService.description && (
                <p className="text-sm text-muted-foreground">
                  {selectedService.description}
                </p>
              )}
              {selectedService.durationMinutes && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {selectedService.durationMinutes} minutes
                </div>
              )}
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={onBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Change Service
              </Button>
              <Button onClick={() => setStep('date')}>
                Select Date
              </Button>
            </div>
          </div>
        )}

        {/* Step: Date Selection */}
        {step === 'date' && (
          <div className="space-y-4 py-4">
            <h4 className="font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Select Available Date
            </h4>

            {availableDates.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No available dates at the moment. Please check back later.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto">
                {availableDates.map((d) => {
                  const dateStr = new Date(d.date).toISOString().split('T')[0];
                  return (
                    <button
                      key={d.id}
                      onClick={() => handleDateSelect(dateStr)}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        selectedDate === dateStr
                          ? 'border-primary bg-primary/10'
                          : 'hover:border-primary/50 hover:bg-muted/50'
                      }`}
                    >
                      <div className="font-medium">
                        {new Date(d.date).toLocaleDateString('en-NG', {
                          weekday: 'short',
                          day: 'numeric',
                        })}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(d.date).toLocaleDateString('en-NG', {
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep('service')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </div>
          </div>
        )}

        {/* Step: Customer Details */}
        {step === 'details' && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
              {/* Selected date summary */}
              {selectedDate && (
                <div className="bg-muted p-3 rounded-lg text-sm">
                  <span className="text-muted-foreground">Date: </span>
                  <span className="font-medium">{formatDate(new Date(selectedDate))}</span>
                </div>
              )}

              <FormField
                control={form.control}
                name="customerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="customerEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="john@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="customerPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number *</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        placeholder="08012345678"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                    <p className="text-xs text-muted-foreground">
                      Required for WhatsApp and phone calls
                    </p>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="customerAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Address *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter full address for service delivery (e.g., 123 Main Street, Lagos Island, Lagos State)"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                    <p className="text-xs text-muted-foreground">
                      Required for service delivery location
                    </p>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any special requests or requirements..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Payment summary */}
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Service:</span>
                  <span>{selectedService.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Date:</span>
                  <span>{selectedDate ? formatDate(new Date(selectedDate)) : '-'}</span>
                </div>
                <div className="border-t my-2" />
                <div className="flex justify-between font-bold">
                  <span>Total:</span>
                  <span className="text-primary">
                    {formatPrice(selectedService.price)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  60% ({formatPrice(Math.floor(selectedService.price * 0.6))}) paid to creator immediately.
                  40% paid after service completion.
                </p>
              </div>

              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep('date')}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Proceed to Payment'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        )}

        {/* Step: Payment Processing */}
        {step === 'payment' && (
          <div className="py-8 text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p>Processing your payment...</p>
            <p className="text-sm text-muted-foreground">
              Please complete the payment in the popup window.
            </p>
          </div>
        )}

        {/* Step: Success */}
        {step === 'success' && bookingResult && (
          <div className="py-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">Booking Confirmed!</h3>
              <p className="text-muted-foreground">
                Your booking with {creatorName} has been confirmed.
              </p>
            </div>
            <div className="bg-muted p-4 rounded-lg text-sm space-y-2">
              <p>
                <strong>Service:</strong> {selectedService.name}
              </p>
              <p>
                <strong>Date:</strong> {selectedDate && formatDate(new Date(selectedDate))}
              </p>
              <p>
                <strong>Amount Paid:</strong> {formatPrice(selectedService.price)}
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              A confirmation email with your tracking link has been sent to your email address.
            </p>
            <Button onClick={handleClose} className="w-full">
              Done
            </Button>
          </div>
        )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

