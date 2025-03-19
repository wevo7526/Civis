import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return new NextResponse(
        JSON.stringify({ error: 'No signature found' }),
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        webhookSecret
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return new NextResponse(
        JSON.stringify({ error: 'Webhook signature verification failed' }),
        { status: 400 }
      );
    }

    const supabase = createRouteHandlerClient({ cookies });

    // Handle the event
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        const subscription = event.data.object as Stripe.Subscription;
        
        // Get the price details
        const price = await stripe.prices.retrieve(subscription.items.data[0].price.id);
        
        // Update subscription in database
        await supabase
          .from('subscriptions')
          .upsert({
            id: subscription.id,
            user_id: subscription.metadata.user_id,
            status: subscription.status,
            plan: price.nickname || 'Unknown Plan',
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end
          });
        break;

      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object as Stripe.Subscription;
        
        // Mark subscription as cancelled in database
        await supabase
          .from('subscriptions')
          .update({
            status: 'canceled',
            cancel_at_period_end: false
          })
          .eq('id', deletedSubscription.id);
        break;

      case 'payment_method.attached':
        const paymentMethod = event.data.object as Stripe.PaymentMethod;
        
        // Update billing details in database
        if (paymentMethod.card) {
          await supabase
            .from('billing_details')
            .upsert({
              user_id: paymentMethod.customer,
              last4: paymentMethod.card.last4,
              brand: paymentMethod.card.brand,
              exp_month: paymentMethod.card.exp_month,
              exp_year: paymentMethod.card.exp_year
            });
        }
        break;

      case 'payment_method.detached':
        const detachedPaymentMethod = event.data.object as Stripe.PaymentMethod;
        
        // Remove billing details from database
        await supabase
          .from('billing_details')
          .delete()
          .eq('user_id', detachedPaymentMethod.customer);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new NextResponse(
      JSON.stringify({ received: true }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error handling webhook:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    );
  }
} 