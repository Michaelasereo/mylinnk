import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/server';
import { prisma } from '@odim/database';
import { serializePrismaObject, serializeCreator } from '@/lib/utils/serialization';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  console.log('🎯 Creator API called');

  try {
    // 1. Initialize Supabase client CORRECTLY for route handlers
    const supabase = await createRouteHandlerClient();

    // 2. Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError) {
      console.error('❌ Auth error:', authError);
      return NextResponse.json(
        { error: 'Authentication failed', details: authError.message },
        { status: 401 }
      );
    }

    if (!user) {
      console.error('❌ No user found');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log(`✅ User authenticated: ${user.id} (${user.email})`);

    // 3. Find or create creator
    let creator = await prisma.creator.findUnique({
      where: { userId: user.id }
    });

    if (!creator) {
      console.log(`🆕 Creating new creator for user ${user.id}`);

      // Generate a unique username
      const baseUsername = user.email?.split('@')[0] || `user_${user.id.slice(0, 8)}`;
      let username = baseUsername;
      let counter = 1;

      // Check if username exists
      while (await prisma.creator.findUnique({ where: { username } })) {
        username = `${baseUsername}${counter}`;
        counter++;
      }

      creator = await prisma.creator.create({
        data: {
          userId: user.id,
          username,
          displayName: user.user_metadata?.full_name || username,
          email: user.email || '',
          balance: 0,
          pendingBalance: 0,
          totalEarnings: 0,
          payoutThreshold: 500000, // 5000 NGN in kobo
          currentBalance: 0,
          trustScore: 100,
          isPublic: true
        }
      });

      console.log(`✅ Creator created: ${creator.id}`);
    }

    console.log(`✅ Creator found: ${creator.id}`);

    // 4. Serialize ALL Prisma special types
    const serializedCreator = serializeCreator(creator);

    // 5. Return serialized creator
    return NextResponse.json(serializedCreator);

  } catch (error: any) {
    console.error('❌ Creator API error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

