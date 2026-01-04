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
import { Calendar, X, Plus } from 'lucide-react';
import {
  addAvailabilityDate,
  removeAvailabilityDate,
} from '@/lib/actions/availability';
import { useRouter } from 'next/navigation';

interface AvailabilityDate {
  id: string;
  date: Date;
  isAvailable: boolean;
  maxBookings: number | null;
}

interface AvailabilityTabProps {
  creatorId: string;
  initialAvailability: AvailabilityDate[];
}

export function AvailabilityTab({
  creatorId,
  initialAvailability,
}: AvailabilityTabProps) {
  const router = useRouter();
  const [dates, setDates] = useState<AvailabilityDate[]>(initialAvailability);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [isAdding, setIsAdding] = useState(false);

  async function handleAddDate() {
    if (!selectedDate) return;

    setIsAdding(true);
    try {
      const date = new Date(selectedDate);
      const result = await addAvailabilityDate(date);
      if (result.success) {
        router.refresh();
        setSelectedDate('');
      }
    } catch (error) {
      console.error('Error adding date:', error);
    }
    setIsAdding(false);
  }

  async function handleRemoveDate(date: Date) {
    try {
      const result = await removeAvailabilityDate(date);
      if (result.success) {
        router.refresh();
      }
    } catch (error) {
      console.error('Error removing date:', error);
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-NG', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Availability</h2>
        <p className="text-muted-foreground">
          Set the dates you&apos;re available for bookings
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add Available Date</CardTitle>
          <CardDescription>
            Select dates when you&apos;re available to provide services
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <Button onClick={handleAddDate} disabled={!selectedDate || isAdding}>
              <Plus className="mr-2 h-4 w-4" />
              {isAdding ? 'Adding...' : 'Add Date'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Available Dates</CardTitle>
          <CardDescription>
            Your upcoming available dates for bookings
          </CardDescription>
        </CardHeader>
        <CardContent>
          {dates.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No available dates set. Add dates when you&apos;re available for bookings.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {dates.map((date) => (
                <div
                  key={date.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{formatDate(date.date)}</p>
                      {date.maxBookings && (
                        <p className="text-sm text-muted-foreground">
                          Max {date.maxBookings} booking{date.maxBookings !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={date.isAvailable ? 'default' : 'secondary'}>
                      {date.isAvailable ? 'Available' : 'Unavailable'}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveDate(date.date)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

