import { NextRequest, NextResponse } from 'next/server';
import { createContent } from '@/lib/actions/content';
import { withCreatorSessionValidation } from '@/lib/auth/session-middleware';

export async function POST(request: NextRequest) {
  return withCreatorSessionValidation(request, async (session, user) => {
    try {
      const data = await request.json();

      const result = await createContent(data);

      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        contentId: result.contentId
      });
    } catch (error) {
      console.error('Content creation error:', error);
      return NextResponse.json(
        { error: 'Failed to create content' },
        { status: 500 }
      );
    }
  });
}
