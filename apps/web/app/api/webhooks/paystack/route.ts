import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { webhookQueue, queues } from '@/lib/queue/queue-manager';
import { withRateLimit, rateLimiters } from '@/lib/rate-limit/rate-limiter';

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting for webhook endpoint (generous limits for Paystack)
    const rateLimitResult = await withRateLimit(request, rateLimiters.generous);

    if (!rateLimitResult.allowed) {
      console.warn('Webhook rate limit exceeded');
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        {
          status: 429,
          headers: rateLimitResult.headers,
        }
      );
    }

    const body = await request.text();
    const signature = request.headers.get('x-paystack-signature');

    if (!signature) {
      console.error('Webhook received without signature');
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 401 }
      );
    }

    // Verify webhook signature using Paystack secret key
    const hash = crypto
      .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY || '')
      .update(body)
      .digest('hex');

    if (hash !== signature) {
      console.error('Webhook signature verification failed');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const event = JSON.parse(body);
    console.log(`Webhook received: ${event.event}`, { reference: event.data?.reference });

    // Add webhook processing job to queue (if available)
    if (queues.redisConnected && webhookQueue) {
      await webhookQueue.add(
        `webhook-${event.event}`,
        {
          event: event.event,
          data: event.data,
          webhookId: event.data?.id || crypto.randomUUID(),
          attempt: 1,
          maxAttempts: 3,
          receivedAt: new Date(),
        },
        {
          priority: getEventPriority(event.event),
          delay: 0, // Process immediately
          removeOnComplete: 100,
          removeOnFail: 50,
        }
      );

      console.log(`Webhook queued for processing: ${event.event}`);
    } else {
      // Fallback: Process webhook directly if Redis not available
      console.log(`Redis not available, processing webhook directly: ${event.event}`);

      // For testing purposes, just log the event
      console.log('Webhook data:', {
        event: event.event,
        reference: event.data?.reference,
        amount: event.data?.amount,
      });
    }
    return NextResponse.json(
      { received: true, queued: true },
      { headers: rateLimitResult.headers }
    );
  } catch (error) {
    console.error('Webhook queuing error:', error);
    return NextResponse.json(
      { error: 'Webhook queuing failed' },
      { status: 500 }
    );
  }
}

// Determine job priority based on event type
function getEventPriority(eventType: string): number {
  switch (eventType) {
    case 'charge.success':
      return 10; // Highest priority - customer paid, needs immediate access
    case 'transfer.success':
    case 'transfer.failed':
      return 8; // High priority - payout status updates
    case 'subscription.create':
      return 7; // Medium-high priority - subscription management
    case 'invoice.payment_succeeded':
      return 7; // Medium-high priority - recurring payments
    default:
      return 5; // Normal priority for other events
  }
}

