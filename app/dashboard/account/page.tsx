'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { CreditCard, Package, Receipt, Shield } from 'lucide-react';
import { Loading } from '@/components/ui/loading';

export default function AccountPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push('/login');
      }
    };
    checkAuth();
  }, [supabase, router]);

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Account Settings</h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Subscription Status</CardTitle>
            <CardDescription>Your current subscription plan and billing information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Package className="h-5 w-5 text-gray-500" />
                <span>Free Plan</span>
              </div>
              <p className="text-sm text-gray-500">
                Premium features coming soon. Stay tuned for updates!
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Method</CardTitle>
            <CardDescription>Your saved payment information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <CreditCard className="h-5 w-5 text-gray-500" />
                <span>No payment method saved</span>
              </div>
              <p className="text-sm text-gray-500">
                Payment methods will be available when premium features are launched.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 