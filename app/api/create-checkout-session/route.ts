import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export async function POST(req: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get the user from the session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return new NextResponse(
        JSON.stringify({ error: 'Not authenticated' }),
        { status: 401 }
      );
    }

    // Get the request body
    const body = await req.json();
    const { price_id } = body;

    if (!price_id) {
      return new NextResponse(
        JSON.stringify({ error: 'Price ID is required' }),
        { status: 400 }
      );
    }

    // Check if user already has a Stripe customer ID
    let { data: customerData } = await supabase
      .from('customers')
      .select('stripe_customer_id')
      .eq('user_id', session.user.id)
      .single();

    let stripeCustomerId: string;

    if (!customerData?.stripe_customer_id) {
      // Create a new Stripe customer
      const customer = await stripe.customers.create({
        email: session.user.email,
        metadata: {
          user_id: session.user.id
        }
      });

      // Save the customer ID to your database
      await supabase
        .from('customers')
        .insert({
          user_id: session.user.id,
          stripe_customer_id: customer.id
        });

      stripeCustomerId = customer.id;
    } else {
      stripeCustomerId = customerData.stripe_customer_id;
    }

    // Create a Stripe Checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      line_items: [
        {
          price: price_id,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/account?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/account?canceled=true`,
      automatic_tax: { enabled: true },
      customer_update: {
        address: 'auto',
        name: 'auto',
      },
      billing_address_collection: 'required',
    });

    return new NextResponse(
      JSON.stringify({ url: checkoutSession.url }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    );
  }
} 