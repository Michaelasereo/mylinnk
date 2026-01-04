import { NextRequest, NextResponse } from 'next/server';
import { completeService } from '@/lib/actions/booking';
import { sendCompletionEmail } from '@/lib/actions/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingId } = body;

    if (!bookingId) {
      return NextResponse.json(
        { error: 'Missing booking ID' },
        { status: 400 }
      );
    }

    const result = await completeService(bookingId);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // Send completion email to customer
    await sendCompletionEmail(bookingId);

    return NextResponse.json({
      success: true,
      booking: result.data,
      transactionId: result.transactionId,
    });
  } catch (error) {
    console.error('Error completing service:', error);
    return NextResponse.json(
      { error: 'Failed to complete service' },
      { status: 500 }
    );
  }
}

