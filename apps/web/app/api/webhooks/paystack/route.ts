import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@odim/database';
import crypto from 'crypto';
import { createCollectionSubscription, createTutorialPurchase, sendCollectionAccessCode, sendTutorialAccessCode } from '@/lib/actions/collection-access';
import { sendCollectionSubscriptionConfirmation, sendTutorialPurchaseConfirmation } from '@/lib/actions/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-paystack-signature');

    if (!signature) {
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
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const event = JSON.parse(body);

    // Handle different event types
    switch (event.event) {
      case 'charge.success':
        await handleSuccessfulPayment(event.data);
        break;
      case 'transfer.success':
        await handleSuccessfulTransfer(event.data);
        break;
      case 'subscription.create':
        await handleSubscriptionCreate(event.data);
        break;
      default:
        console.log('Unhandled event:', event.event);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleSuccessfulPayment(data: any) {
  const { metadata, reference, customer, amount, fees, authorization } = data;

  // Handle collection subscription payment
  if (metadata?.type === 'collection_subscription') {
    await handleCollectionSubscriptionPayment(data);
    return;
  }

  // Handle tutorial purchase payment
  if (metadata?.type === 'tutorial_purchase') {
    await handleTutorialPurchasePayment(data);
    return;
  }

  // Handle existing payment types (booking, subscription, etc.)
  const transaction = await prisma.transaction.findUnique({
    where: { reference: reference },
  });

  if (!transaction) {
    console.error('Transaction not found:', reference);
    return;
  }

  // Extract metadata from transaction
  const transactionMetadata = transaction.metadata as {
    phone?: string;
    subscriber_email?: string;
    plan_id?: string;
  } | null;

  const subscriberEmail = transactionMetadata?.subscriber_email || customer?.email;
  const subscriberPhone = transactionMetadata?.phone;
  const planId = transactionMetadata?.plan_id;

  // Update transaction status
  await prisma.transaction.update({
    where: { id: transaction.id },
    data: {
      status: 'success',
      gatewayResponse: data,
      netAmount: amount - (fees || 0),
      feeAmount: fees || 0,
    },
  });

  // If it's a subscription payment, create or update subscription
  if (transaction.type === 'subscription' && transaction.creatorId) {
    const creator = await prisma.creator.findUnique({
      where: { id: transaction.creatorId },
    });

    if (creator) {
      // Update creator earnings
      await prisma.creator.update({
        where: { id: creator.id },
        data: {
          totalEarnings: {
            increment: transaction.amount - (fees || 0),
          },
          currentBalance: {
            increment: transaction.amount - (fees || 0),
          },
          subscriberCount: {
            increment: 1,
          },
        },
      });

      // For subscriptions without a userId (guest subscribers),
      // we need to create a temporary user or use email-based identification
      let fanId = transaction.userId;

      if (!fanId && subscriberEmail) {
        // Try to find existing user by email
        let user = await prisma.user.findUnique({
          where: { email: subscriberEmail.toLowerCase() },
        });

        if (!user) {
          // Create a placeholder user for the subscriber
          user = await prisma.user.create({
            data: {
              id: crypto.randomUUID(),
              email: subscriberEmail.toLowerCase(),
              phoneNumber: subscriberPhone,
              fullName: customer?.first_name
                ? `${customer.first_name} ${customer.last_name || ''}`
                : undefined,
            },
          });
        }

        fanId = user.id;

        // Update phone number if provided and user exists
        if (subscriberPhone && user) {
          await prisma.user.update({
            where: { id: user.id },
            data: { phoneNumber: subscriberPhone },
          });
        }
      }

      if (fanId) {
        // Create or update fan subscription
        await prisma.fanSubscription.upsert({
          where: {
            unique_active_subscription: {
              fanId: fanId,
              creatorId: transaction.creatorId,
            },
          },
          create: {
            fanId: fanId,
            creatorId: transaction.creatorId,
            planId: planId || undefined,
            status: 'active',
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(
              Date.now() + 30 * 24 * 60 * 60 * 1000
            ),
            paystackAuthorizationCode: authorization?.authorization_code,
            metadata: {
              subscriber_email: subscriberEmail,
              subscriber_phone: subscriberPhone,
            },
          },
          update: {
            status: 'active',
            planId: planId || undefined,
            lastPaymentDate: new Date(),
            nextPaymentDate: new Date(
              Date.now() + 30 * 24 * 60 * 60 * 1000
            ),
            paystackAuthorizationCode: authorization?.authorization_code,
            metadata: {
              subscriber_email: subscriberEmail,
              subscriber_phone: subscriberPhone,
            },
          },
        });
      }
    }
  }
}

async function handleCollectionSubscriptionPayment(data: any) {
  const { metadata, reference, amount, fees } = data;
  const { collectionId, email, subscriptionType, creatorId } = metadata;

  try {
    // Create a transaction record
    const transaction = await prisma.transaction.create({
      data: {
        reference,
        creatorId,
        amount,
        feeAmount: fees || 0,
        netAmount: amount - (fees || 0),
        status: 'success',
        type: 'collection_subscription',
        gatewayResponse: data,
        metadata: {
          collectionId,
          email,
          subscriptionType,
        },
      },
    });

    // Create the collection subscription
    const result = await createCollectionSubscription({
      collectionId,
      email,
      subscriptionType,
      paymentReference: reference,
      transactionId: transaction.id,
    });

    if (!result.success) {
      console.error('Failed to create collection subscription:', result.error);
      return;
    }

    // Get collection and creator info for email
    const collection = await prisma.collection.findUnique({
      where: { id: collectionId },
      include: {
        creator: {
          select: {
            id: true,
            displayName: true,
          },
        },
      },
    });

    if (collection) {
      // Update creator earnings
      await prisma.creator.update({
        where: { id: collection.creator.id },
        data: {
          totalEarnings: {
            increment: amount - (fees || 0),
          },
          currentBalance: {
            increment: amount - (fees || 0),
          },
        },
      });

      // Send confirmation email
      await sendCollectionSubscriptionConfirmation(
        email,
        collection.title,
        collection.creator.displayName,
        subscriptionType,
        amount
      );

      // Send access code
      await sendCollectionAccessCode(email, collectionId);
    }

    console.log('Collection subscription created:', {
      collectionId,
      email,
      reference,
    });
  } catch (error) {
    console.error('Error handling collection subscription payment:', error);
  }
}

async function handleTutorialPurchasePayment(data: any) {
  const { metadata, reference, amount, fees } = data;
  const { contentId, email, creatorId } = metadata;

  try {
    // Create a transaction record
    const transaction = await prisma.transaction.create({
      data: {
        reference,
        creatorId,
        amount,
        feeAmount: fees || 0,
        netAmount: amount - (fees || 0),
        status: 'success',
        type: 'tutorial_purchase',
        gatewayResponse: data,
        metadata: {
          contentId,
          email,
        },
      },
    });

    // Create the tutorial purchase
    const result = await createTutorialPurchase({
      contentId,
      email,
      paymentReference: reference,
      transactionId: transaction.id,
    });

    if (!result.success) {
      console.error('Failed to create tutorial purchase:', result.error);
      return;
    }

    // Get tutorial and creator info for email
    const tutorial = await prisma.content.findUnique({
      where: { id: contentId },
      include: {
        creator: {
          select: {
            id: true,
            displayName: true,
          },
        },
      },
    });

    if (tutorial) {
      // Update creator earnings
      await prisma.creator.update({
        where: { id: tutorial.creator.id },
        data: {
          totalEarnings: {
            increment: amount - (fees || 0),
          },
          currentBalance: {
            increment: amount - (fees || 0),
          },
        },
      });

      // Send confirmation email
      await sendTutorialPurchaseConfirmation(
        email,
        tutorial.title,
        tutorial.creator.displayName,
        amount
      );

      // Send access code
      await sendTutorialAccessCode(email, contentId);
    }

    console.log('Tutorial purchase created:', {
      contentId,
      email,
      reference,
    });
  } catch (error) {
    console.error('Error handling tutorial purchase payment:', error);
  }
}

async function handleSuccessfulTransfer(data: any) {
  // Update payout status
  const payout = await prisma.payout.findFirst({
    where: { paystackTransferCode: data.transfer_code },
  });

  if (payout) {
    await prisma.payout.update({
      where: { id: payout.id },
      data: {
        status: 'success',
        processedAt: new Date(),
      },
    });
  }
}

async function handleSubscriptionCreate(data: any) {
  // Handle subscription creation from Paystack
  console.log('Subscription created:', data);
}
