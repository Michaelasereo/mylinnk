import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event, properties } = body;

    // Log analytics event
    console.log('Analytics event:', event, properties);

    // Here you would send to your analytics service
    // For example: Plausible, Google Analytics, etc.

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Analytics tracking error:', error);
    return NextResponse.json(
      { error: 'Failed to track event' },
      { status: 500 }
    );
  }
}

