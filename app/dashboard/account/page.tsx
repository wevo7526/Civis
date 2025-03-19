'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { CreditCard, Package, Receipt, Shield } from 'lucide-react';

interface SubscriptionDetails {
  status: string;
  plan: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
}

interface BillingDetails {
  last4: string;
  brand: string;
  exp_month: number;
  exp_year: number;
}

export default function AccountPage() {
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionDetails | null>(null);
  const [billingDetails, setBillingDetails] = useState<BillingDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchSubscriptionDetails = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          router.push('/login');
          return;
        }

        // Fetch subscription details from your Stripe webhook-updated table
        const { data: subscriptionData } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', session.user.id)
          .single();

        if (subscriptionData) {
          setSubscription({
            status: subscriptionData.status,
            plan: subscriptionData.plan,
            current_period_end: new Date(subscriptionData.current_period_end).toLocaleDateString(),
            cancel_at_period_end: subscriptionData.cancel_at_period_end
          });
        }

        // Fetch billing details (last 4 digits, etc.) from your secure storage
        const { data: billingData } = await supabase
          .from('billing_details')
          .select('*')
          .eq('user_id', session.user.id)
          .single();

        if (billingData) {
          setBillingDetails({
            last4: billingData.last4,
            brand: billingData.brand,
            exp_month: billingData.exp_month,
            exp_year: billingData.exp_year
          });
        }
      } catch (error) {
        console.error('Error fetching subscription details:', error);
        setError('Failed to load account details');
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptionDetails();
  }, [supabase, router]);

  const handleManageSubscription = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push('/login');
        return;
      }

      setLoading(true);
      
      // Call your API endpoint that creates a Stripe Customer Portal session
      const response = await fetch('/api/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: session.user.id,
        }),
      });

      const { url } = await response.json();
      
      // Redirect to Stripe Customer Portal
      window.location.href = url;
    } catch (error) {
      console.error('Error creating portal session:', error);
      setError('Failed to open billing portal');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradeSubscription = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push('/login');
        return;
      }

      setLoading(true);
      
      // Call your API endpoint that creates a Stripe Checkout session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: session.user.id,
          price_id: 'your_stripe_price_id', // You'll need to replace this with your actual Stripe Price ID
        }),
      });

      const { url } = await response.json();
      
      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      setError('Failed to start upgrade process');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Account & Billing</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your subscription and billing details
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-gray-500" />
              Current Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            {subscription ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Plan</p>
                    <p className="mt-1 text-lg font-semibold">{subscription.plan}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Status</p>
                    <p className="mt-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        subscription.status === 'active' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {subscription.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500">Current Period</p>
                  <p className="mt-1">Renews on {subscription.current_period_end}</p>
                </div>

                {subscription.cancel_at_period_end && (
                  <div className="rounded-md bg-yellow-50 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <Receipt className="h-5 w-5 text-yellow-400" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800">
                          Subscription set to cancel
                        </h3>
                        <p className="mt-2 text-sm text-yellow-700">
                          Your subscription will end on {subscription.current_period_end}. 
                          You can reactivate your subscription from the billing portal.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500">No active subscription</p>
                <Button
                  onClick={handleUpgradeSubscription}
                  className="mt-4"
                  disabled={loading}
                >
                  Upgrade Now
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-gray-500" />
              Payment Method
            </CardTitle>
          </CardHeader>
          <CardContent>
            {billingDetails ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  {billingDetails.brand === 'visa' && (
                    <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none">
                      <rect x="2" y="5" width="20" height="14" rx="2" className="fill-[#1434CB]"/>
                      <path d="M15.5 12L13.5 8L11.5 12M9.5 12L7.5 8L5.5 12" stroke="white"/>
                    </svg>
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {billingDetails.brand.charAt(0).toUpperCase() + billingDetails.brand.slice(1)} ending in {billingDetails.last4}
                    </p>
                    <p className="text-sm text-gray-500">
                      Expires {billingDetails.exp_month}/{billingDetails.exp_year}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">No payment method on file</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-gray-500" />
              Billing Portal
            </CardTitle>
            <CardDescription>
              Manage your subscription, payment methods, and billing history
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleManageSubscription}
              className="w-full sm:w-auto"
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Manage Billing'}
            </Button>
          </CardContent>
        </Card>

        {error && (
          <div className="rounded-lg bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 