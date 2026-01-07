'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar as CalendarIcon, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface Availability {
  id: string;
  date: string;
  isAvailable: boolean;
  maxBookings: number | null;
}

interface AvailabilityManagerProps {
  availability: Availability[];
}

export function AvailabilityManager({ availability }: AvailabilityManagerProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [currentAvailability, setCurrentAvailability] = useState<Availability | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (selectedDate) {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const existing = availability.find(a => a.date === dateStr);
      setCurrentAvailability(existing || null);
    }
  }, [selectedDate, availability]);

  const handleToggleAvailability = async (isAvailable: boolean) => {
    if (!selectedDate) return;

    setIsUpdating(true);
    setMessage('');

    try {
      const dateStr = selectedDate.toISOString().split('T')[0];

      const response = await fetch('/api/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: dateStr,
          isAvailable,
          maxBookings: isAvailable ? 5 : null // Default max bookings when available
        })
      });

      const result = await response.json();

      if (response.ok) {
        setMessage(isAvailable ? 'Date marked as available' : 'Date marked as unavailable');
        // Update local state
        setCurrentAvailability(result.availability);
        // Refresh the page to get updated availability
        setTimeout(() => window.location.reload(), 1000);
      } else {
        setMessage(result.error || 'Failed to update availability');
      }
    } catch (error) {
      setMessage('An unexpected error occurred');
    } finally {
      setIsUpdating(false);
    }
  };

  const getAvailabilityForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return availability.find(a => a.date === dateStr);
  };

  const isDateInPast = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Availability Management</h2>
        <p className="text-muted-foreground">
          Set your available dates for customer bookings
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calendar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              Select Date
            </CardTitle>
            <CardDescription>
              Click on a date to manage availability
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={isDateInPast}
              modifiers={{
                available: (date) => {
                  const avail = getAvailabilityForDate(date);
                  return avail?.isAvailable || false;
                },
                unavailable: (date) => {
                  const avail = getAvailabilityForDate(date);
                  return avail && !avail.isAvailable;
                }
              }}
              modifiersClassNames={{
                available: 'bg-green-100 text-green-900',
                unavailable: 'bg-red-100 text-red-900'
              }}
              className="rounded-md border"
            />

            <div className="mt-4 flex gap-2 text-sm">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-100 rounded"></div>
                <span>Available</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-100 rounded"></div>
                <span>Unavailable</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Date Details & Controls */}
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedDate ? selectedDate.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              }) : 'Select a Date'}
            </CardTitle>
            <CardDescription>
              Manage availability for this date
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedDate && (
              <>
                <div className="flex items-center gap-2">
                  <Badge variant={currentAvailability?.isAvailable ? 'default' : 'secondary'}>
                    {currentAvailability?.isAvailable ? 'Available' : 'Unavailable'}
                  </Badge>
                  {currentAvailability?.maxBookings && (
                    <Badge variant="outline">
                      Max {currentAvailability.maxBookings} bookings
                    </Badge>
                  )}
                </div>

                {message && (
                  <Alert>
                    <AlertDescription>{message}</AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-3">
                  <Button
                    onClick={() => handleToggleAvailability(true)}
                    disabled={isUpdating || isDateInPast(selectedDate)}
                    className="flex-1"
                  >
                    {isUpdating ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <CheckCircle className="w-4 h-4 mr-2" />
                    )}
                    Mark Available
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleToggleAvailability(false)}
                    disabled={isUpdating || isDateInPast(selectedDate)}
                    className="flex-1"
                  >
                    {isUpdating ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <XCircle className="w-4 h-4 mr-2" />
                    )}
                    Mark Unavailable
                  </Button>
                </div>

                {isDateInPast(selectedDate) && (
                  <Alert>
                    <AlertDescription>
                      Cannot modify availability for past dates.
                    </AlertDescription>
                  </Alert>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Availability Overview</CardTitle>
          <CardDescription>Your current availability status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {availability.filter(a => a.isAvailable).length}
              </div>
              <div className="text-sm text-gray-500">Available Days</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {availability.filter(a => !a.isAvailable).length}
              </div>
              <div className="text-sm text-gray-500">Unavailable Days</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {availability.length}
              </div>
              <div className="text-sm text-gray-500">Total Configured</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
