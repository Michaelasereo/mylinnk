import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { webhookQueue, deadLetterQueue } from '@/lib/queue/queue-manager';

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { webhookId } = await request.json();

    if (!webhookId) {
      return NextResponse.json(
        { error: 'webhookId is required' },
        { status: 400 }
      );
    }

    // Find the failed job in dead letter queue
    const failedJob = await deadLetterQueue.getJob(webhookId);

    if (!failedJob) {
      return NextResponse.json(
        { error: 'Failed webhook not found' },
        { status: 404 }
      );
    }

    // Requeue the job with reset attempt counter
    await webhookQueue.add(
      `retry-${failedJob.data.event}`,
      {
        ...failedJob.data,
        attempt: 1, // Reset attempts for manual retry
        maxAttempts: 3,
        retriedAt: new Date(),
        retriedBy: session.user.id,
      },
      {
        priority: 9, // High priority for manual retries
        delay: 0,
        removeOnComplete: 100,
        removeOnFail: 50,
      }
    );

    // Remove from dead letter queue
    await failedJob.remove();

    console.log(`Manually retried webhook: ${webhookId}`);

    return NextResponse.json({
      success: true,
      message: 'Webhook retry queued successfully',
    });
  } catch (error) {
    console.error('Webhook retry error:', error);
    return NextResponse.json(
      { error: 'Failed to retry webhook' },
      { status: 500 }
    );
  }
}
